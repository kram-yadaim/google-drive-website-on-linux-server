# HomeDrive

A Google-Drive-style website for the folder your Samba server shares. It runs on the Ubuntu PC
next to Samba and reads the shared folder directly, so Samba and the website always see the
same files. Reach it from your phone or laptop over Tailscale.

**What you get**

- Browse folders in list or grid view (with photo thumbnails), sort by name, date or size
- Upload files **and whole folders**: drag & drop or the **New** button, with a progress panel.
  There's no size limit; files stream straight to disk and keep their original dates
- Download files, or download folders / several items as a zip (streamed, so it starts right away)
- Preview photos (←/→ or swipe), videos, music, PDFs and text/code files in the browser
- New folder, rename, move, copy, drag items onto folders to move them
- Trash with **Undo** and Restore. Items are deleted for good after 30 days
- Search the whole drive, see disk usage, use it on a phone, dark mode, Hebrew/RTL file names
- Password login. Windows-unsafe characters (`: ? * " < > |`) in uploaded names are replaced so
  Samba clients can still open them

## Install on the Ubuntu PC

1. Copy the `homedrive` folder to the Ubuntu PC (this setup uses `/usr/peleg/doc/homedrive`).
2. On the Ubuntu PC:

   ```bash
   cd /usr/peleg/doc/homedrive
   chmod +x install.sh
   ./install.sh
   ```

   It shares **`/mnt/storage_1tb`** by default (for another folder: `SHARE_ROOT=/some/path ./install.sh`)
   and asks for a username/password for the website. It then installs a `homedrive` service that
   starts on boot, after the drive is mounted.

   If the code folder isn't writable by you (anything under `/usr` usually isn't), the installer
   keeps the venv, `config.json` and thumbnail cache in `~/.local/share/homedrive` instead.
   The installer prints where they went.
3. Open `http://<tailscale-ip-of-ubuntu-pc>:8080` from any device on your tailnet. With MagicDNS
   on you can use `http://<ubuntu-pc-name>:8080`. The installer prints both.

> **Firewall:** if `ufw` is on, the installer prints the rule to let Tailscale devices in:
> `sudo ufw allow in on tailscale0 to any port 8080 proto tcp`.
> That rule also keeps the site **off your home LAN and the internet**: only your tailnet can reach it.

### Recommended: HTTPS with `tailscale serve`

This gives you a real `https://` address that only exists inside your tailnet, and the app no
longer listens on the network at all:

```bash
BIND=127.0.0.1 ./install.sh            # listen only on this PC
sudo tailscale serve --bg 8080         # publish https://<pc-name>.<tailnet>.ts.net to your tailnet
```

Then add `"behind_proxy": true` to `config.json` and run `sudo systemctl restart homedrive`.
That way the login rate limit sees each device's real address. If `tailscale serve` says HTTPS
isn't enabled, follow the link it prints to turn on HTTPS certificates for your tailnet.

## File permissions (important)

The service runs as the user who ran `install.sh`. That user must be able to **write** to the
share, or uploads will fail with "Permission denied". The installer warns you if it can't.

- If your share uses `force user = someone` in `smb.conf`, run the service as that user:
  `RUN_USER=someone ./install.sh`
- New files are created group-writable (`UMask=0002`) so Samba users in the same group can edit them.

## Users & settings

The installer prints the exact command for your setup. With the code in `/usr/peleg/doc/homedrive`
(settings in `~/.local/share/homedrive`) it is:

```bash
export HOMEDRIVE_CONFIG=~/.local/share/homedrive/config.json
HD=~/.local/share/homedrive/venv/bin/python
$HD /usr/peleg/doc/homedrive/manage.py adduser alice   # add a user
$HD /usr/peleg/doc/homedrive/manage.py passwd alice    # change password
$HD /usr/peleg/doc/homedrive/manage.py deluser alice   # remove a user
$HD /usr/peleg/doc/homedrive/manage.py users           # list users
sudo systemctl restart homedrive                       # apply changes
```

`config.json` (created by setup, readable only by you):

| key            | default     | meaning                                                         |
|----------------|-------------|-----------------------------------------------------------------|
| `share_root`   | —           | the shared folder                                               |
| `title`        | `HomeDrive` | name shown in the browser                                       |
| `trash_days`   | `30`        | days before trashed items are deleted for good (`0` = never)    |
| `session_days` | `30`        | how long you stay signed in                                     |
| `behind_proxy` | `false`     | set `true` when using `tailscale serve`                         |
| `cache_dir`    | `./cache`   | where photo thumbnails are cached                               |

To change the port, re-run `PORT=9000 ./install.sh`.

## Good to know

- Trashed items go to a hidden `.homedrive_trash` folder inside the share. Samba hides dot-folders
  by default. Deleting from Windows/Samba directly does **not** go through this trash.
- Search looks at file and folder names across the whole share. It stops after 500 matches or
  8 seconds on very large shares.
- Videos play if your browser supports the format (MP4/H.264 and WebM work everywhere; MKV/AVI may not).
  Otherwise you get a Download button.

## Maintenance

```bash
journalctl -u homedrive -f              # live logs
sudo systemctl restart homedrive        # restart (after editing files or config.json)
sudo systemctl disable --now homedrive  # stop and don't start on boot
```

To update, copy the new files over the old ones (keep `config.json`) and run `./install.sh` again.
