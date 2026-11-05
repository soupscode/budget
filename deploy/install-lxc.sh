#!/bin/sh
# Install Budget into a Debian/Ubuntu LXC as a systemd service.
# Run as root from the unpacked budget/ folder:  sh deploy/install-lxc.sh
set -eu
command -v python3 >/dev/null || { apt-get update && apt-get install -y python3; }
id budget >/dev/null 2>&1 || useradd --system --home /var/lib/budget --shell /usr/sbin/nologin budget
mkdir -p /opt/budget /var/lib/budget
cp -r server.py static /opt/budget/
chown -R budget:budget /var/lib/budget
cp deploy/budget.service /etc/systemd/system/budget.service
systemctl daemon-reload
systemctl enable --now budget
sleep 1
systemctl --no-pager --lines=3 status budget || true
echo
echo "Budget is up on http://$(hostname -I | awk '{print $1}'):8080"
echo "Over Tailscale: http://$(hostname):8080  (or run: tailscale serve --bg 8080)"
