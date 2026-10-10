#!/usr/bin/env bash
# HomeDrive installer for Ubuntu / Debian.
# Run it from the homedrive folder as your normal user (it uses sudo when needed):
#     ./install.sh
# Options (environment variables):
#     SHARE_ROOT=/mnt/storage_1tb   the folder to serve (your Samba share)
#     PORT=8080                     port to listen on
#     BIND=0.0.0.0                  address to listen on (use 127.0.0.1 together with `tailscale serve`)
#     RUN_USER=<user>               account the service runs as (must be able to write to the share)
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE=homedrive
SHARE_ROOT="${SHARE_ROOT:-/mnt/storage_1tb}"
PORT="${PORT:-8080}"
BIND="${BIND:-0.0.0.0}"
RUN_USER="${RUN_USER:-$USER}"

if [[ $EUID -eq 0 ]]; then
  echo "Please run this as your normal user, not with sudo (it asks for sudo itself when needed)." >&2
  exit 1
fi

# The code can live anywhere (even a read-only place like /usr/...). The venv, config.json and
# thumbnail cache go next to it if that folder is writable, otherwise into ~/.local/share/homedrive.
if [[ -w "$APP_DIR" ]]; then
  DATA_DIR="$APP_DIR"
else
  DATA_DIR="$HOME/.local/share/homedrive"
  mkdir -p "$DATA_DIR"
  echo "    $APP_DIR isn't writable, so settings and packages go in $DATA_DIR"
fi
VENV="$DATA_DIR/venv"
CONFIG="$DATA_DIR/config.json"
export HOMEDRIVE_CONFIG="$CONFIG"

if [[ ! -d "$SHARE_ROOT" ]]; then
  echo "Share folder $SHARE_ROOT not found. Is the drive mounted? (check: findmnt $SHARE_ROOT)" >&2
  exit 1
fi

echo "==> Checking Python"
if ! python3 -c 'import venv, ensurepip' 2>/dev/null; then
  echo "    Installing python3-venv (needs sudo)"
  sudo apt-get update -qq
  sudo apt-get install -y python3-venv
fi

echo "==> Installing Python packages into $VENV"
[[ -d "$VENV" ]] || python3 -m venv "$VENV"
"$VENV/bin/pip" install --quiet --upgrade pip
"$VENV/bin/pip" install --quiet -r "$APP_DIR/requirements.txt"

if [[ ! -f "$CONFIG" ]]; then
  echo "==> First-time setup (sharing $SHARE_ROOT)"
  "$VENV/bin/python" "$APP_DIR/manage.py" init --root "$SHARE_ROOT"
fi

SHARE_ROOT="$("$VENV/bin/python" -c 'import json, sys; print(json.load(open(sys.argv[1]))["share_root"])' "$CONFIG")"
RUN_GROUP="$(id -gn "$RUN_USER")"

if ! sudo -u "$RUN_USER" test -w "$SHARE_ROOT"; then
  echo
  echo "    WARNING: '$RUN_USER' can't write to $SHARE_ROOT (owner: $(stat -c %U "$SHARE_ROOT"))."
  echo "    Browsing will work but uploads won't. Either re-run with RUN_USER=<owner> ./install.sh"
  echo "    or give $RUN_USER write access to the drive (see README: File permissions)."
  echo
fi

echo "==> Installing systemd service '$SERVICE' (runs as $RUN_USER, listens on $BIND:$PORT)"
sudo tee /etc/systemd/system/$SERVICE.service >/dev/null <<EOF
[Unit]
Description=HomeDrive web file manager for $SHARE_ROOT
After=network-online.target
Wants=network-online.target
RequiresMountsFor=$SHARE_ROOT

[Service]
User=$RUN_USER
Group=$RUN_GROUP
WorkingDirectory=$APP_DIR
Environment="HOMEDRIVE_CONFIG=$CONFIG"
ExecStart="$VENV/bin/gunicorn" --workers 2 --worker-class gthread --threads 8 --timeout 300 --limit-request-line 8190 --bind $BIND:$PORT app:app
Restart=on-failure
RestartSec=3
UMask=0002

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --quiet $SERVICE
sudo systemctl restart $SERVICE
sleep 2

if ! systemctl is-active --quiet $SERVICE; then
  echo "The service didn't start. See what went wrong with:  journalctl -u $SERVICE -n 50" >&2
  exit 1
fi

echo
echo "HomeDrive is running, serving $SHARE_ROOT"
TS_IP="$(tailscale ip -4 2>/dev/null | head -n1 || true)"
if [[ "$BIND" == "127.0.0.1" ]]; then
  echo "  It only listens on this PC. Publish it to your tailnet with HTTPS:"
  echo "      sudo tailscale serve --bg $PORT"
else
  [[ -n "$TS_IP" ]] && echo "  From any device on your tailnet:  http://$TS_IP:$PORT"
  echo "  Or with MagicDNS:                  http://$(hostname):$PORT"
fi
echo "  Settings: $CONFIG"
echo "  Users:    HOMEDRIVE_CONFIG=$CONFIG $VENV/bin/python $APP_DIR/manage.py adduser NAME"
echo "  Logs:     journalctl -u $SERVICE -f"

if command -v ufw >/dev/null && sudo ufw status 2>/dev/null | grep -q "Status: active"; then
  echo
  echo "  ufw firewall is active. To allow Tailscale devices in, run:"
  echo "      sudo ufw allow in on tailscale0 to any port $PORT proto tcp"
fi
