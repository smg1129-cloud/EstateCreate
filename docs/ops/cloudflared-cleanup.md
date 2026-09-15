# Managing cloudflared tunnels on the host

Field notes from getting `estate.grocloud.one` live and untangling the box's
existing Cloudflare Tunnel setup. This is host operations, not EstateCreate app
code — keep it here so the next person (or future you) has the map.

## Final architecture on this box

One connector per tunnel, each supervised so it survives reboot. Two styles
coexist cleanly:

| Tunnel | Origin service | Served by | Supervisor |
|---|---|---|---|
| `estate` | EstateCreate, `localhost:3000` | host `cloudflared-estate.service` | systemd |
| `recordsguard` | `localhost:8088` | host `cloudflared-recordsguard.service` | systemd |
| `cms` | Dockerized app | cloudflared **Docker sidecar** | Docker |
| `id-scan` | Dockerized app | cloudflared **Docker sidecar** | Docker |

Rule of thumb that emerged: **host apps get a host systemd cloudflared service;
Dockerized apps get a cloudflared sidecar container.** Don't run a host
connector for a tunnel whose origin only exists inside Docker (and vice-versa) —
Cloudflare load-balances across a tunnel's connectors, so a connector that can't
reach the origin will 5xx a fraction of requests.

## Principles (the safe way to change any of this)

1. **Diagnose before you touch anything.** Map every running connector to a
   tunnel and a supervisor first (below). Live sites are at stake.
2. **One change at a time**, and reload the affected site in a browser after each.
3. **Bring the replacement up and confirm healthy _before_ removing the old
   thing.** Never kill the only connector serving a live site.
4. **One `cloudflared.service` per host.** For additional host tunnels use
   uniquely-named units (`cloudflared-<name>.service`) — do **not**
   `cloudflared service install` a second time (it refuses).
5. **Manage `--token`/`--token-file` tunnels in the Cloudflare dashboard.** In
   token mode the on-disk `config.yml` is ignored; hostnames live under the
   tunnel's **Published application routes**.

## Diagnose: what's actually running?

```bash
# every connector process, how it was launched
pgrep -af cloudflared

# host systemd units
systemctl list-units --all 'cloudflared*'
ls -l /etc/systemd/system/ | grep -i cloud
sudo ls -l /etc/cloudflared/

# tunnels in the account, and which connectors each has
cloudflared tunnel list
cloudflared tunnel info <name>          # CONNECTOR ID / VERSION / ORIGIN IP / EDGE
curl -s https://ifconfig.me; echo       # this box's public IP (to match ORIGIN IP)
```

Reading `pgrep`/`cloudflared tunnel info`:

- A process launched with `--token-file X` or `--config X.yml` is a normal host
  connector — trace it to its systemd unit.
- A **bare** `cloudflared … tunnel … run` (no token, no config) whose parent is
  `containerd-shim-runc-v2` and whose cgroup is `…/docker-*.scope` is a
  **Docker sidecar**, not a host stray — Docker restarts it, so its PID changes.
  Leave it to Docker.
- **Behind NAT, ORIGIN IP does not distinguish machines** (all your boxes share
  one public IP). Use the cloudflared **VERSION** + connector **CREATED** time
  to tell a host connector from a Docker one (e.g. the host binary was
  `2026.8.3`, the Docker image `2026.7.3`).

Identify what an unknown process supervises:

```bash
# for a suspicious PID: parent + cgroup reveal the supervisor
ps -o pid,ppid,cmd -p <PID>
cat /proc/<PID>/cgroup
# a docker-*.scope cgroup => Docker; a system.slice/<unit> => that systemd unit
```

If a host `cloudflared.service` runs `--token-file /etc/cloudflared/token` but
that file is **missing**, it's a time bomb: it keeps running on the token it
read at startup and **fails on the next restart/reboot**. Find which tunnel it
serves before replacing it:

```bash
journalctl -u cloudflared.service --no-pager | grep -i "Starting tunnel\|tunnelID=" | head
# or match this box's connector under `cloudflared tunnel info <name>`
```

## Create a clean host connector (template)

For a tunnel this host should serve, as its own reboot-safe unit:

```bash
NAME=estate
echo 'PASTE_TUNNEL_TOKEN' | sudo tee /etc/cloudflared/${NAME}-token >/dev/null
sudo chmod 600 /etc/cloudflared/${NAME}-token

sudo tee /etc/systemd/system/cloudflared-${NAME}.service >/dev/null <<EOF
[Unit]
Description=Cloudflare Tunnel (${NAME})
After=network.target

[Service]
ExecStart=/usr/bin/cloudflared --no-autoupdate tunnel run --token-file /etc/cloudflared/${NAME}-token
Restart=on-failure
RestartSec=5
User=root

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now cloudflared-${NAME}
sudo systemctl status cloudflared-${NAME} --no-pager -n 8   # want active + "Registered tunnel connection"
```

The token comes from **Zero Trust → Networks → Tunnels & Mesh → <tunnel> → Add a
connector** (the `eyJ…` string). Add the hostname under the tunnel's **Published
application routes** → `HTTP` → `localhost:<port>`; that also creates the DNS
record. TLS is terminated by Cloudflare — no Nginx/certbot needed.

## Retire a redundant / broken host connector (test-first)

```bash
sudo systemctl stop cloudflared-<name>      # stop, don't delete yet
# wait ~15s, reload the site:
#   still works  -> the other connector (e.g. a Docker sidecar) covers it:
sudo systemctl disable cloudflared-<name>
sudo rm /etc/systemd/system/cloudflared-<name>.service /etc/cloudflared/<name>-token
sudo systemctl daemon-reload
#   breaks       -> this connector was doing real work; bring it back:
sudo systemctl start cloudflared-<name>
```

## Verify reboot-safety

```bash
# host services
systemctl is-enabled cloudflared-estate cloudflared-recordsguard    # each: enabled
# Docker sidecars must have a restart policy or they won't come back on reboot
docker ps --format '{{.ID}} {{.Names}}' | while read id name; do
  echo "$name restart=$(docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' "$id")"
done
# fix any that say "no":  docker update --restart unless-stopped <id>
```

Ideally reboot in a maintenance window and confirm every site returns on its own.

## Gotchas we hit

- **`cloudflared service install` refuses** when a `cloudflared.service` already
  exists — use a uniquely-named unit instead (principle 4).
- **The two "strays" were Docker sidecars,** not host junk. Their PIDs churn
  because Docker restarts them; `kill` is pointless and wrong.
- **A missing `/etc/cloudflared/token`** referenced by a running service only
  bites on restart/reboot — replace it before then.
- **`config.yml` vs a named `--config`.** The default `config.yml` is only read
  by a bare `tunnel run`; connectors launched with `--config <name>.yml` or a
  token ignore it. We renamed the stale default to `config.yml.unused` so a
  stray `tunnel run` can't silently pick it up.
- **Token hygiene.** A tunnel token grants the ability to attach a connector to
  that tunnel. If one is ever pasted into a chat/ticket/screen-share, rotate it
  (dashboard → tunnel → refresh token) and update the box's token file + restart
  the service.
