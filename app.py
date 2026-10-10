"""HomeDrive - a Google-Drive-style web UI for a folder on this machine (e.g. a Samba share).

Run `python manage.py init` once to create config.json, then start with gunicorn
(see install.sh) or `python app.py` for a quick test.
"""
import hashlib
import json
import mimetypes
import os
import shutil
import stat
import tempfile
import time
import uuid
import zipfile
from datetime import timedelta
from pathlib import Path
from urllib.parse import quote, unquote

from flask import Flask, Response, abort, jsonify, redirect, render_template, request, send_file, session
from werkzeug.exceptions import HTTPException
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.security import check_password_hash

try:
    from PIL import Image, ImageOps
except ImportError:  # thumbnails are optional
    Image = None

BASE_DIR = Path(__file__).resolve().parent
CONFIG_PATH = Path(os.environ.get("HOMEDRIVE_CONFIG", BASE_DIR / "config.json"))
TRASH_NAME = ".homedrive_trash"
CHUNK = 1024 * 1024


def load_config():
    if not CONFIG_PATH.exists():
        raise SystemExit(f"No config at {CONFIG_PATH}. Run: python manage.py init")
    with open(CONFIG_PATH, encoding="utf-8") as f:
        return json.load(f)


CFG = load_config()
ROOT = Path(CFG["share_root"]).expanduser().resolve()
if not ROOT.is_dir():
    raise SystemExit(f"share_root {ROOT} is not a folder")
TRASH_DIR = ROOT / TRASH_NAME
TRASH_DAYS = int(CFG.get("trash_days", 30))
TITLE = CFG.get("title", "HomeDrive")


def _thumb_dir():
    candidates = (CFG.get("cache_dir"), CONFIG_PATH.parent / "cache", BASE_DIR / "cache",
                  Path(tempfile.gettempdir()) / "homedrive-cache")
    for base in candidates:
        if not base:
            continue
        d = Path(base) / "thumbs"
        try:
            d.mkdir(parents=True, exist_ok=True)
            if os.access(d, os.W_OK):
                return d
        except OSError:
            pass
    return None


THUMB_DIR = _thumb_dir() if Image else None

app = Flask(__name__)
app.config.update(
    SECRET_KEY=CFG["secret_key"],
    SESSION_COOKIE_NAME="homedrive_session",
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    PERMANENT_SESSION_LIFETIME=timedelta(days=int(CFG.get("session_days", 30))),
    MAX_CONTENT_LENGTH=None,  # uploads are streamed straight to disk, no size limit
)
if CFG.get("behind_proxy"):
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)


# --------------------------------------------------------------------------- file kinds

_KINDS = {
    "image": "jpg jpeg jfif png gif webp bmp svg avif ico apng tif tiff heic",
    "video": "mp4 m4v webm mov mkv ogv avi wmv flv mpg mpeg 3gp ts",
    "audio": "mp3 wav ogg oga m4a flac aac opus wma",
    "pdf": "pdf",
    "text": "txt md markdown log csv tsv ini cfg conf nfo srt vtt",
    "code": "py js mjs ts tsx jsx json xml yml yaml toml html htm css scss sh bash zsh bat cmd ps1 "
            "c h cpp hpp cc cs java kt go rs rb php sql lua pl r swift dart vue svelte "
            "dockerfile makefile gradle properties env gitignore",
    "archive": "zip rar 7z tar gz tgz bz2 xz zst iso dmg",
    "doc": "doc docx odt rtf pages",
    "sheet": "xls xlsx ods numbers",
    "slides": "ppt pptx odp key",
}
EXT_KIND = {ext: kind for kind, exts in _KINDS.items() for ext in exts.split()}
# Served inline with a sandbox CSP so an uploaded HTML/SVG file can't run scripts as you.
SANDBOX_TYPES = {"text/html", "application/xhtml+xml", "image/svg+xml", "text/xml", "application/xml"}
# Characters Windows can't use in file names; Samba would show such files with mangled names.
WINDOWS_BAD_CHARS = '<>:"|?*'


def kind_of(name, is_dir):
    if is_dir:
        return "folder"
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else name.lower()
    return EXT_KIND.get(ext, "file")


# --------------------------------------------------------------------------- paths

def clean_rel(rel):
    """Normalise a client-supplied relative path ("a/b/c") and reject traversal."""
    parts = [p for p in str(rel or "").replace("\\", "/").split("/") if p not in ("", ".")]
    if ".." in parts or any("\0" in p for p in parts):
        abort(400, "Invalid path")
    return "/".join(parts)


def _inside_root(p):
    try:
        p.resolve().relative_to(ROOT)
        return True
    except ValueError:
        return False


def resolve(rel, must_exist=True):
    """Map a relative path to a Path inside ROOT. Symlinks may not point outside the share."""
    rel = clean_rel(rel)
    if rel.split("/", 1)[0] == TRASH_NAME:
        abort(403, "Use the Trash view for that")
    p = ROOT.joinpath(*rel.split("/")) if rel else ROOT
    if not _inside_root(p):
        abort(403, "That location is outside the shared folder")
    if must_exist and not os.path.lexists(p):
        abort(404, "Not found - it may have been moved or deleted")
    return p


def rel_of(p):
    return "" if p == ROOT else p.relative_to(ROOT).as_posix()


def check_name(name, fix=False):
    name = str(name or "").strip()
    if fix:  # uploads: quietly swap characters Windows/Samba can't handle
        name = "".join("_" if c in WINDOWS_BAD_CHARS else c for c in name)
    if not name or name in (".", "..") or any(c in name for c in "/\\\0"):
        abort(400, "Invalid name")
    if any(c in name for c in WINDOWS_BAD_CHARS):
        abort(400, f"Names can't contain any of  {' '.join(WINDOWS_BAD_CHARS)}  (Windows can't open them over Samba)")
    if len(name.encode("utf-8", "surrogateescape")) > 255:
        abort(400, "That name is too long")
    if name == TRASH_NAME:
        abort(400, "That name is reserved")
    return name


def unique_path(parent, name, is_dir=False):
    """parent/name, or 'name (1).ext', 'name (2).ext'... if taken."""
    target = parent / name
    if not os.path.lexists(target):
        return target
    stem, ext = (name, "") if is_dir else os.path.splitext(name)
    i = 1
    while True:
        target = parent / f"{stem} ({i}){ext}"
        if not os.path.lexists(target):
            return target
        i += 1


def make_entry(rel, name, st):
    is_dir = stat.S_ISDIR(st.st_mode)
    return {
        "name": name,
        "path": rel,
        "is_dir": is_dir,
        "size": None if is_dir else st.st_size,
        "mtime": st.st_mtime,
        "kind": kind_of(name, is_dir),
    }


def entry_for(p):
    return make_entry(rel_of(p), p.name, p.stat())


def json_body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        abort(400, "Expected a JSON body")
    return data


def paths_from(data):
    rels = data.get("paths")
    if not isinstance(rels, list) or not rels:
        abort(400, "Nothing selected")
    paths = [resolve(r) for r in rels]
    if any(p == ROOT for p in paths):
        abort(400, "You can't do that to My Drive itself")
    return paths


def content_disposition(filename):
    stem, ext = os.path.splitext(filename)
    ascii_stem = stem.encode("ascii", "ignore").decode().replace('"', "").strip() or "download"
    return f"attachment; filename=\"{ascii_stem}{ext}\"; filename*=UTF-8''{quote(filename)}"


# --------------------------------------------------------------------------- auth

_failed_logins = {}


@app.before_request
def guard():
    if request.endpoint in ("login", "static"):
        return None
    user = session.get("user")
    if not user or user not in CFG.get("users", {}):
        if request.path.startswith("/api/"):
            return jsonify(error="Not signed in"), 401
        return redirect("/login?next=" + quote(request.full_path.rstrip("?")))
    # CSRF: browsers won't send this custom header cross-site without a CORS preflight we never allow.
    if (request.path.startswith("/api/") and request.method not in ("GET", "HEAD")
            and request.endpoint != "api_zip" and request.headers.get("X-Requested-With") != "HomeDrive"):
        abort(403, "Missing request header")
    return None


@app.route("/login", methods=["GET", "POST"])
def login():
    error = None
    nxt = request.values.get("next", "")
    if not nxt.startswith("/") or nxt.startswith("//") or nxt.startswith("/\\"):
        nxt = "/"
    if request.method == "POST":
        ip = request.remote_addr or "?"
        now = time.time()
        recent = [t for t in _failed_logins.get(ip, []) if now - t < 300]
        _failed_logins[ip] = recent
        if len(recent) >= 10:
            error = "Too many failed attempts. Try again in a few minutes."
        else:
            username = request.form.get("username", "").strip()
            pw_hash = CFG.get("users", {}).get(username)
            if pw_hash and check_password_hash(pw_hash, request.form.get("password", "")):
                session.clear()
                session.permanent = True
                session["user"] = username
                _failed_logins.pop(ip, None)
                return redirect(nxt)
            recent.append(now)
            time.sleep(1)
            error = "Wrong username or password."
    return render_template("login.html", title=TITLE, error=error, next=nxt)


@app.get("/logout")
def logout():
    session.clear()
    return redirect("/login")


# --------------------------------------------------------------------------- pages

@app.get("/")
def home():
    return redirect("/drive/")


@app.get("/drive/", defaults={"subpath": ""})
@app.get("/drive/<path:subpath>")
@app.get("/trash")
@app.get("/search")
def spa(subpath=""):
    return render_template("index.html", title=TITLE, user=session["user"],
                           thumbs=THUMB_DIR is not None, trash_days=TRASH_DAYS)


# --------------------------------------------------------------------------- browsing

@app.get("/api/list")
def api_list():
    rel = clean_rel(request.args.get("path"))
    folder = resolve(rel)
    if not folder.is_dir():
        abort(400, "Not a folder")
    items = []
    with os.scandir(folder) as it:
        for e in it:
            if not rel and e.name == TRASH_NAME:
                continue
            try:
                st = e.stat()
            except OSError:  # broken symlink etc.
                continue
            items.append(make_entry(f"{rel}/{e.name}" if rel else e.name, e.name, st))
    return jsonify(path=rel, items=items)


@app.get("/api/storage")
def api_storage():
    u = shutil.disk_usage(ROOT)
    return jsonify(total=u.total, used=u.used, free=u.free)


@app.get("/api/search")
def api_search():
    words = request.args.get("q", "").casefold().split()
    if not words:
        return jsonify(items=[], truncated=False)
    items, truncated = [], False
    deadline = time.monotonic() + 8
    for dirpath, dirnames, filenames in os.walk(ROOT):
        base = Path(dirpath)
        if base == ROOT:
            dirnames[:] = [d for d in dirnames if d != TRASH_NAME]
        rel_dir = rel_of(base)
        for name in dirnames + filenames:
            folded = name.casefold()
            if all(w in folded for w in words):
                try:
                    st = (base / name).stat()
                except OSError:
                    continue
                items.append(make_entry(f"{rel_dir}/{name}" if rel_dir else name, name, st))
        if len(items) >= 500 or time.monotonic() > deadline:
            truncated = True
            break
    return jsonify(items=items[:500], truncated=truncated)


@app.get("/api/file")
def api_file():
    p = resolve(request.args.get("path"))
    if p.is_dir():
        abort(400, "That's a folder")
    download = request.args.get("download") == "1"
    mime = mimetypes.guess_type(p.name)[0] or "application/octet-stream"
    resp = send_file(p, mimetype=mime, as_attachment=download, download_name=p.name,
                     conditional=True, max_age=0)
    resp.headers["X-Content-Type-Options"] = "nosniff"
    if mime in SANDBOX_TYPES or mime.startswith("text/"):
        resp.headers["Content-Security-Policy"] = "sandbox"
    return resp


@app.get("/api/thumb")
def api_thumb():
    if not THUMB_DIR:
        abort(404)
    p = resolve(request.args.get("path"))
    size = 1600 if request.args.get("size") == "lg" else 320
    st = p.stat()
    key = hashlib.sha1(f"{p.resolve()}|{st.st_mtime_ns}|{st.st_size}|{size}"
                       .encode("utf-8", "surrogateescape")).hexdigest()
    out = THUMB_DIR / f"{key}.jpg"
    if not out.exists():
        tmp = THUMB_DIR / f"{key}.{uuid.uuid4().hex}.tmp"
        try:
            with Image.open(p) as im:
                im.draft("RGB", (size, size))  # fast JPEG downscale while decoding
                im = ImageOps.exif_transpose(im)
                im.thumbnail((size, size))
                if im.mode in ("RGBA", "LA", "P"):
                    im = im.convert("RGBA")
                    bg = Image.new("RGB", im.size, (255, 255, 255))
                    bg.paste(im, mask=im.getchannel("A"))
                    im = bg
                elif im.mode != "RGB":
                    im = im.convert("RGB")
                im.save(tmp, "JPEG", quality=82)
            os.replace(tmp, out)
        except Exception:
            tmp.unlink(missing_ok=True)
            abort(415, "Can't make a thumbnail for this file")
    return send_file(out, mimetype="image/jpeg", max_age=30 * 86400)


# --------------------------------------------------------------------------- zip download

class _ZipStream:
    """Write-only buffer: zipfile writes into it, we hand the bytes to the client as we go."""

    def __init__(self):
        self.buf = bytearray()

    def write(self, b):
        self.buf += b
        return len(b)

    def flush(self):
        pass

    def take(self):
        data = bytes(self.buf)
        self.buf.clear()
        return data


def _zip_members(p):
    if not p.is_dir():
        yield p, p.name
        return
    base = p.parent
    for dirpath, dirnames, filenames in os.walk(p):
        d = Path(dirpath)
        if d == ROOT:
            dirnames[:] = [x for x in dirnames if x != TRASH_NAME]
        rel = d.relative_to(base).as_posix()
        if not dirnames and not filenames:
            yield d, rel + "/"
        for fn in filenames:
            yield d / fn, f"{rel}/{fn}"


def _zip_iter(paths):
    out = _ZipStream()
    with zipfile.ZipFile(out, "w", zipfile.ZIP_STORED, allowZip64=True) as zf:
        for p in paths:
            for full, arcname in _zip_members(p):
                try:
                    info = zipfile.ZipInfo.from_file(full, arcname, strict_timestamps=False)
                    if info.is_dir():
                        zf.writestr(info, b"")
                    else:
                        with open(full, "rb") as src, zf.open(info, "w") as dst:
                            while True:
                                chunk = src.read(CHUNK)
                                if not chunk:
                                    break
                                dst.write(chunk)
                                yield out.take()
                except OSError:
                    continue  # unreadable file: skip it rather than abort the whole download
                yield out.take()
    yield out.take()


@app.post("/api/zip")
def api_zip():
    try:
        rels = json.loads(request.form.get("paths", "[]"))
    except ValueError:
        abort(400, "Bad request")
    if not isinstance(rels, list) or not rels:
        abort(400, "Nothing selected")
    paths = [resolve(r) for r in rels]
    if len(paths) == 1:
        name = TITLE if paths[0] == ROOT else paths[0].name
    else:
        name = "download-" + time.strftime("%Y-%m-%d_%H%M%S")
    return Response(_zip_iter(paths), mimetype="application/zip",
                    headers={"Content-Disposition": content_disposition(name + ".zip")})


# --------------------------------------------------------------------------- changes

def _claim(tmp, folder, name):
    """Give the uploaded temp file its final name without ever overwriting an existing file."""
    for _ in range(1000):
        dest = unique_path(folder, name)
        try:
            os.link(tmp, dest)  # fails if dest appeared meanwhile, unlike rename
        except FileExistsError:
            continue
        except OSError:  # filesystem without hard links (FAT etc.)
            os.replace(tmp, dest)
            return dest
        tmp.unlink()
        return dest
    abort(409, "Couldn't find a free file name")


@app.route("/api/upload", methods=["PUT", "POST"])
def api_upload():
    # Names travel in headers (URL-encoded) so long/deep paths don't hit URL length limits.
    dir_rel = clean_rel(unquote(request.headers.get("X-Upload-Dir", "")))
    name_rel = clean_rel(unquote(request.headers.get("X-Upload-Name", "")))
    if not name_rel:
        abort(400, "Missing file name")
    parts = [check_name(x, fix=True) for x in name_rel.split("/")]
    folder = resolve("/".join(x for x in [dir_rel, *parts[:-1]] if x), must_exist=False)
    try:
        folder.mkdir(parents=True, exist_ok=True)
    except FileExistsError:
        abort(409, "A file with the same name as a folder is in the way")
    tmp = folder / f".homedrive-{uuid.uuid4().hex}.part"
    try:
        with open(tmp, "wb") as f:
            while True:
                chunk = request.stream.read(CHUNK)
                if not chunk:
                    break
                f.write(chunk)
        if request.content_length is not None and tmp.stat().st_size != request.content_length:
            abort(400, "Upload was interrupted")
        dest = _claim(tmp, folder, parts[-1])
    except BaseException:
        tmp.unlink(missing_ok=True)
        raise
    mtime = request.headers.get("X-Upload-Mtime", "")
    if mtime.isdigit():  # keep the file's original "last modified" date
        try:
            os.utime(dest, (time.time(), int(mtime) / 1000))
        except (OSError, OverflowError, ValueError):
            pass
    return jsonify(entry_for(dest))


@app.post("/api/mkdir")
def api_mkdir():
    data = json_body()
    parent = resolve(data.get("path"))
    target = parent / check_name(data.get("name"))
    if os.path.lexists(target):
        abort(409, "Something with that name already exists here")
    target.mkdir()
    return jsonify(entry_for(target))


@app.post("/api/rename")
def api_rename():
    data = json_body()
    src = resolve(data.get("path"))
    if src == ROOT:
        abort(400, "You can't rename My Drive")
    name = check_name(data.get("name"))
    dest = src.parent / name
    if name != src.name and os.path.lexists(dest):
        try:
            same = os.path.samefile(src, dest)  # case-only rename on a case-insensitive disk
        except OSError:
            same = False
        if not same:
            abort(409, "Something with that name already exists here")
    os.rename(src, dest)
    return jsonify(entry_for(dest))


def _transfer(copy):
    data = json_body()
    dest = resolve(data.get("dest"))
    if not dest.is_dir():
        abort(400, "The destination isn't a folder")
    srcs = paths_from(data)
    dest_real = dest.resolve()
    for src in srcs:  # validate everything before touching anything
        if src.is_dir() and not src.is_symlink():
            src_real = src.resolve()
            if dest_real == src_real or src_real in dest_real.parents:
                abort(400, f"Can't put “{src.name}” inside itself")
    count = 0
    for src in srcs:
        is_dir = src.is_dir() and not src.is_symlink()
        if not copy and src.parent.resolve() == dest_real:
            continue  # already there
        target = unique_path(dest, src.name, is_dir)
        if copy and is_dir:
            shutil.copytree(src, target, symlinks=True)
        elif copy:
            shutil.copy2(src, target, follow_symlinks=False)
        else:
            shutil.move(str(src), str(target))
        count += 1
    return jsonify(count=count)


@app.post("/api/move")
def api_move():
    return _transfer(copy=False)


@app.post("/api/copy")
def api_copy():
    return _transfer(copy=True)


# --------------------------------------------------------------------------- trash
# Deleted items are moved to <share>/.homedrive_trash/items/<id>, with a JSON record in meta/<id>.json.

def _trash_dirs():
    items, meta = TRASH_DIR / "items", TRASH_DIR / "meta"
    items.mkdir(parents=True, exist_ok=True)
    meta.mkdir(exist_ok=True)
    return items, meta


def _trash_records():
    _, meta = _trash_dirs()
    out = []
    for f in meta.glob("*.json"):
        try:
            out.append(json.loads(f.read_text(encoding="utf-8")))
        except (OSError, ValueError):
            continue
    return out


def _trash_id(tid):
    if not isinstance(tid, str) or len(tid) != 32 or any(c not in "0123456789abcdef" for c in tid):
        abort(400, "Bad trash id")
    return tid


def _destroy(tid):
    items, meta = _trash_dirs()
    p = items / tid
    if p.is_dir() and not p.is_symlink():
        shutil.rmtree(p)
    elif os.path.lexists(p):
        p.unlink()
    (meta / f"{tid}.json").unlink(missing_ok=True)


def _purge_old_trash():
    if TRASH_DAYS <= 0:
        return
    cutoff = time.time() - TRASH_DAYS * 86400
    for rec in _trash_records():
        if rec.get("deleted_at", 0) < cutoff:
            try:
                _destroy(_trash_id(rec.get("id")))
            except (OSError, HTTPException):
                pass


def _ids_from(data):
    ids = data.get("ids")
    if not isinstance(ids, list) or not ids:
        abort(400, "Nothing selected")
    return [_trash_id(t) for t in ids]


@app.post("/api/delete")
def api_delete():
    srcs = paths_from(json_body())
    items, meta = _trash_dirs()
    ids = []
    for src in srcs:
        tid = uuid.uuid4().hex
        is_dir = src.is_dir() and not src.is_symlink()
        size = None if is_dir else src.lstat().st_size
        shutil.move(str(src), str(items / tid))
        rec = {"id": tid, "name": src.name, "path": rel_of(src), "is_dir": is_dir, "size": size,
               "deleted_at": time.time(), "kind": kind_of(src.name, is_dir)}
        (meta / f"{tid}.json").write_text(json.dumps(rec), encoding="utf-8")
        ids.append(tid)
    _purge_old_trash()
    return jsonify(ids=ids)


@app.get("/api/trash")
def api_trash():
    _purge_old_trash()
    items = [dict(rec, mtime=rec.get("deleted_at")) for rec in _trash_records()]
    return jsonify(items=items, days=TRASH_DAYS)


@app.post("/api/trash/restore")
def api_trash_restore():
    items, meta = _trash_dirs()
    count = 0
    for tid in _ids_from(json_body()):
        mf = meta / f"{tid}.json"
        if not mf.exists():
            continue
        rec = json.loads(mf.read_text(encoding="utf-8"))
        orig = clean_rel(rec.get("path", ""))
        parent = resolve(orig.rsplit("/", 1)[0] if "/" in orig else "", must_exist=False)
        parent.mkdir(parents=True, exist_ok=True)
        target = unique_path(parent, check_name(rec.get("name")), rec.get("is_dir", False))
        shutil.move(str(items / tid), str(target))
        mf.unlink()
        count += 1
    return jsonify(count=count)


@app.post("/api/trash/delete")
def api_trash_delete():
    ids = _ids_from(json_body())
    for tid in ids:
        _destroy(tid)
    return jsonify(count=len(ids))


@app.post("/api/trash/empty")
def api_trash_empty():
    recs = _trash_records()
    for rec in recs:
        _destroy(_trash_id(rec.get("id")))
    return jsonify(count=len(recs))


# --------------------------------------------------------------------------- errors

@app.errorhandler(HTTPException)
def http_error(e):
    if request.path.startswith("/api/"):
        return jsonify(error=e.description), e.code
    return e


@app.errorhandler(OSError)
def os_error(e):
    app.logger.warning("OS error on %s: %s", request.path, e)
    if isinstance(e, PermissionError):
        code = 403
    elif isinstance(e, FileExistsError):
        code = 409
    elif isinstance(e, FileNotFoundError):
        code = 404
    else:
        code = 500
    return jsonify(error=e.strerror or str(e)), code


if __name__ == "__main__":
    host, port = CFG.get("host", "0.0.0.0"), int(CFG.get("port", 8080))
    print(f"HomeDrive: serving {ROOT} on http://{host}:{port}  (dev server - use gunicorn for real use)")
    app.run(host=host, port=port, threaded=True)
