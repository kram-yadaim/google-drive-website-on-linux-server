#!/usr/bin/env python3
"""HomeDrive setup helper.

  python manage.py init              first-time setup (share folder + first user)
  python manage.py adduser NAME      add a user
  python manage.py passwd NAME       change a user's password
  python manage.py deluser NAME      remove a user
  python manage.py users             list users

Restart the service after changes:  sudo systemctl restart homedrive
"""
import argparse
import getpass
import json
import os
import secrets
import sys
from pathlib import Path

from werkzeug.security import generate_password_hash

CONFIG = Path(os.environ.get("HOMEDRIVE_CONFIG", Path(__file__).resolve().parent / "config.json"))
DEFAULT_SHARE = "/mnt/storage_1tb"


def load():
    if CONFIG.exists():
        return json.loads(CONFIG.read_text(encoding="utf-8"))
    return {}


def save(cfg):
    tmp = CONFIG.with_suffix(".tmp")
    tmp.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
    if os.name == "posix":
        os.chmod(tmp, 0o600)  # holds the session secret and password hashes
    os.replace(tmp, CONFIG)
    print(f"Saved {CONFIG}")


def ask_password(user):
    while True:
        p1 = getpass.getpass(f"Password for {user}: ")
        if len(p1) < 8:
            print("  Use at least 8 characters.")
            continue
        if getpass.getpass("Repeat password: ") != p1:
            print("  Passwords don't match, try again.")
            continue
        return p1


def cmd_init(args):
    cfg = load()
    current = cfg.get("share_root", DEFAULT_SHARE)
    root = args.root or input(f"Folder your Samba share points to (the 'path =' in smb.conf) [{current}]: ").strip() or current
    if not root:
        sys.exit("A folder is required.")
    root = os.path.abspath(os.path.expanduser(root))
    if not os.path.isdir(root):
        sys.exit(f"Folder not found: {root}")
    if not os.access(root, os.W_OK):
        print(f"  Warning: {getpass.getuser()} can't write to {root}; uploads will fail unless the service runs as a user who can.")
    cfg["share_root"] = root
    cfg.setdefault("title", "HomeDrive")
    cfg.setdefault("trash_days", 30)
    cfg.setdefault("secret_key", secrets.token_hex(32))
    cfg.setdefault("users", {})
    if not cfg["users"]:
        user = args.user or input("Username for the website [admin]: ").strip() or "admin"
        cfg["users"][user] = generate_password_hash(ask_password(user))
    save(cfg)


def cmd_adduser(args):
    cfg = load()
    if args.name in cfg.get("users", {}):
        sys.exit(f"{args.name} already exists - use: python manage.py passwd {args.name}")
    cfg.setdefault("users", {})[args.name] = generate_password_hash(ask_password(args.name))
    save(cfg)


def cmd_passwd(args):
    cfg = load()
    if args.name not in cfg.get("users", {}):
        sys.exit(f"No user named {args.name}")
    cfg["users"][args.name] = generate_password_hash(ask_password(args.name))
    save(cfg)


def cmd_deluser(args):
    cfg = load()
    if cfg.get("users", {}).pop(args.name, None) is None:
        sys.exit(f"No user named {args.name}")
    save(cfg)


def cmd_users(_args):
    for name in load().get("users", {}):
        print(name)


def main():
    parser = argparse.ArgumentParser(description="HomeDrive setup helper")
    sub = parser.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("init", help="first-time setup")
    p.add_argument("--root", help="path of the shared folder")
    p.add_argument("--user", help="first username")
    p.set_defaults(func=cmd_init)
    for name, func in (("adduser", cmd_adduser), ("passwd", cmd_passwd), ("deluser", cmd_deluser)):
        p = sub.add_parser(name)
        p.add_argument("name")
        p.set_defaults(func=func)
    sub.add_parser("users").set_defaults(func=cmd_users)
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
