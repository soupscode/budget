# Budget

A calm, single-user budget app for your tailnet. You enter everything by hand. It tracks spending, income, credit card payoff, bills, and daily tasks, and gives at most one quiet hint at a time.

- **No dependencies:** Python 3.9+ standard library and SQLite, with a vanilla JS front end and no build step.
- **No login or tokens:** it's built for one person on a private network (Tailscale or LAN).
- **One data file:** everything is stored in `budget.db`. Back it up or snapshot it like anything else.

## Run it

**Quick test (anywhere):**
```sh
python3 server.py            # http://localhost:8080, data in ./data/budget.db
```

**Docker:**
```sh
docker compose up -d --build # data persists in ./data
```

**Proxmox LXC (Debian/Ubuntu, systemd):**
```sh
# copy this folder into the container, then as root:
sh deploy/install-lxc.sh     # installs to /opt/budget, data in /var/lib/budget
```

**Settings (environment variables):**

| Variable | Default |
|---|---|
| `BUDGET_PORT` | `8080` |
| `BUDGET_HOST` | `0.0.0.0` |
| `BUDGET_DB` | `./data/budget.db` |
| `BUDGET_LOG` | off. Set it to `1` for access logs. |

## Tailscale

- **Plain HTTP:** install Tailscale in the LXC, or use the host's subnet routing, then open `http://<machine-name>:8080` from any device on your tailnet.
- **HTTPS with a clean URL:** run `tailscale serve --bg 8080` inside the LXC. The app is then at `https://<machine-name>.<tailnet>.ts.net`.
- **Phone:** on iOS, use Share → Add to Home Screen; on Android, use Install app. It opens full-screen like an app.

There's no authentication by design, so don't port-forward it to the internet. Your tailnet is the security boundary.

## How it works

- **Flexible budget:** the total of your category budgets. "Left to spend" covers only everyday expenses. Rent and other bills are tracked separately, so they don't take from what's left to spend.
- **Bills:** these repeat monthly on their due day. Tap the circle when one is paid and it's logged for that month. If a bill is set to "amount varies," you can edit the logged amount afterwards.
- **Credit cards:** a card's balance is its starting balance, plus charges logged to the card, minus payments. To match your statement (for example, after interest is added), edit the card's **Current balance**. The Debt page simulates payoff by avalanche or snowball at your monthly plan.
- **Hints:** you'll see at most one hint at a time. They cover:
  - a bill due within 3 days
  - a category over budget, with a suggestion for where there's room
  - a category running ahead of last month
  - being well under pace late in the month, with a suggestion to put the extra toward your highest-APR card
  - a logging gap

  Dismissing a hint snoozes it for 7–30 days and keeps every hint quiet for 24 hours. You can turn hints off entirely in Settings.
- **Tasks:** undated tasks stay under Today until they're done. Tasks set to repeat daily reset every morning.
- **Keyboard:** press **N** anywhere to add an entry and **Esc** to close.

## Backup

- From the app: Settings → Export, as JSON (everything) or CSV (transactions).
- From the server: copy `budget.db`. It's safe to copy while the app is running, because SQLite runs in WAL mode.

## Demo data

To try it with sample data, point it at a throwaway database:
```sh
BUDGET_DB=/tmp/demo.db BUDGET_PORT=8099 python3 server.py &
python3 tools/seed_demo.py http://localhost:8099
```
