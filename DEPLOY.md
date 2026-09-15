# Deploying EstateCreate on an Ubuntu box

This guide takes you from nothing to a running EstateCreate instance on an
Ubuntu server, including how to reach a box that isn't on your current network.

> **Scope.** This is an operational runbook. Before EstateCreate prepares a real
> client's plan, read [COMPLIANCE.md](./COMPLIANCE.md) — the app implements the
> technical workflow, but data protection, the unauthorized-practice-of-law
> guardrails, and execution formalities are organizational responsibilities.

Placeholders to substitute throughout: `YOUR_USER` (your Unix username on the
box), `estate-box` (the box's hostname), `estate.example.com` (a domain, only
needed for a public production deployment).

---

## Part 0 — Reaching the box (Tailscale)

Skip this if the box already has a reachable address (a cloud VPS with a public
IP, or you're on the same LAN). Otherwise, the simplest and most secure way to
SSH into a home/office box from anywhere is [Tailscale](https://tailscale.com) —
a WireGuard-based mesh VPN that needs **no router/port-forwarding** and exposes
**nothing** to the public internet. Free for personal use.

You need to touch the box **once** (physically, or while on its LAN) to install it.

**On the box (once):**
```bash
curl -fsSL https://tailscale.com/install.sh | sh          # installs Tailscale
sudo apt-get install -y openssh-server                     # ensure an SSH server
sudo systemctl enable --now ssh
sudo tailscale up --ssh                                    # join tailnet; Tailscale handles SSH auth
tailscale status                                           # note the box's name / peers
tailscale ip -4                                            # note its 100.x.y.z address
```
`tailscale up` prints a login URL — open it in any browser and sign in
(Google / Microsoft / GitHub / email) to create your private tailnet.

**On your Windows PC (once):** install Tailscale from
<https://tailscale.com/download> and sign in with the **same account**.

**Connect (from anywhere):**
```powershell
ssh YOUR_USER@estate-box
# view the web app in your local browser via an SSH tunnel:
ssh -L 3000:localhost:3000 YOUR_USER@estate-box
```
If the name doesn't resolve, use the `100.x.y.z` IP from `tailscale ip -4`, or
enable **MagicDNS** in the Tailscale admin console (Settings → DNS).

Everything below runs **on the box**, in the SSH session.

---

## Part 1 — Prerequisites (once, on the box)

```bash
# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# Docker (used to run PostgreSQL via the bundled compose file)
sudo apt-get install -y docker.io docker-compose-v2
sudo usermod -aG docker "$USER"
```
Then **log out and back in** (`exit`, reconnect) so the `docker` group applies.
Verify with `docker ps` (should work without `sudo`).

> Prefer a Postgres you already run? Skip Docker and set `DATABASE_URL` in
> `.env` (Part 3) to point at it.

---

## Part 2 — Install and run (evaluation)

```bash
git clone https://github.com/smg1129-cloud/EstateCreate.git
cd EstateCreate
git checkout claude/automated-estate-planning-yak4nj   # until merged to main

docker compose up -d                 # PostgreSQL on localhost:5432

cp .env.example .env
# generate the two required secrets and write them into .env:
sed -i "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\"|" .env
sed -i "s|^FIELD_ENCRYPTION_KEY=.*|FIELD_ENCRYPTION_KEY=\"$(openssl rand -base64 32)\"|" .env

npm install
npx prisma generate
npx prisma db push                   # create all tables
npm run db:seed                      # firm, staff, and one demo client (8 generated docs)

npm run dev                          # http://localhost:3000
```

Open `http://localhost:3000` (via the SSH tunnel from Part 0, or directly if
you're on the box's network) and sign in with a seeded account
(password `DevPassword!123`):

| Email | Role |
|---|---|
| `client@estatecreate.test` | Client |
| `attorney@estatecreate.test` | Attorney |
| `paralegal@estatecreate.test` | Paralegal |
| `admin@estatecreate.test` | Admin |

Staff accounts enroll TOTP MFA (`/mfa/setup`) on first login.

`npm run dev` runs in the foreground and stops when you disconnect — fine for a
first look. For a persistent install, use Part 3.

---

## Part 3 — Production install (persistent, behind TLS)

A real deployment differs from the evaluation run in a few ways: a persistent
database, a production build, HTTPS, and a process manager so the app restarts on
reboot.

### 3.1 Environment

Edit `.env` and set at least:

```dotenv
NODE_ENV="production"
NEXTAUTH_URL="https://estate.example.com"   # MUST match how users reach the app
# NEXTAUTH_SECRET / FIELD_ENCRYPTION_KEY: keep the generated values (rotate = re-login / can't decrypt old MFA secrets)
# DATABASE_URL: point at a persistent Postgres (the Docker one persists in a named volume; a managed DB is better)
DOC_STORAGE_PROVIDER="local"                # rendered docs under .data/ ; use an S3 adapter for real deployments
ESIGN_PROVIDER="mock"                        # until a Florida-registered RON vendor is wired
SESSION_IDLE_TIMEOUT_MINUTES="15"
```

`NEXTAUTH_URL` is not optional in production — if it doesn't match the address in
the browser, sign-in redirects break. `.env` is git-ignored; never commit it.

### 3.2 Schema, seed, build

```bash
npx prisma migrate deploy            # applies committed migrations (use instead of db push in prod)
# first time only, if you want the sample firm/users:  npm run db:seed
npm run build
```

> `prisma migrate deploy` requires committed migration files. If the repo has
> none yet, run `npx prisma migrate dev --name init` once in a non-prod checkout,
> commit the generated `prisma/migrations/`, then use `migrate deploy` on the
> server. For a quick internal box, `npx prisma db push` is acceptable.

### 3.3 Run under systemd

Create `/etc/systemd/system/estatecreate.service` (adjust `User`, paths):

```ini
[Unit]
Description=EstateCreate (Next.js)
After=network.target docker.service
Wants=docker.service

[Service]
Type=simple
User=YOUR_USER
WorkingDirectory=/home/YOUR_USER/EstateCreate
EnvironmentFile=/home/YOUR_USER/EstateCreate/.env
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now estatecreate
sudo systemctl status estatecreate        # check it's running
journalctl -u estatecreate -f             # follow logs
```

`npm run start` serves on port 3000 by default (bound to localhost when behind a
reverse proxy). To change the port, add `Environment=PORT=3000` and adjust Nginx.

### 3.4 Nginx reverse proxy + HTTPS

```bash
sudo apt-get install -y nginx
```

Create `/etc/nginx/sites-available/estatecreate`:

```nginx
server {
    listen 80;
    server_name estate.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    client_max_body_size 25m;   # room for uploaded/generated documents
}
```

```bash
sudo ln -s /etc/nginx/sites-available/estatecreate /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# TLS via Let's Encrypt (needs the domain pointing at this box and ports 80/443 open):
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d estate.example.com
```

Certbot rewrites the server block to serve HTTPS and sets up auto-renewal. Make
sure `NEXTAUTH_URL` uses `https://` and restart the service after changing `.env`:
`sudo systemctl restart estatecreate`.

> **Purely private?** If you only ever reach the box over Tailscale, you can skip
> Nginx/certbot and use Tailscale's own HTTPS (`tailscale cert` / `tailscale
> serve`) or just the SSH tunnel — nothing needs to be exposed publicly.

---

## Updating to a new version

```bash
cd ~/EstateCreate
git pull                              # (or: git fetch && git checkout main, once merged)
npm install
npx prisma generate
npx prisma migrate deploy             # or: npx prisma db push
npm run build
sudo systemctl restart estatecreate
```

---

## Data, backups, and secrets

- **Rendered documents** are written under `.data/` by the local storage adapter
  (git-ignored). They contain privileged client content — back them up securely,
  or move to encrypted object storage (S3 + SSE-KMS) via a real storage adapter.
- **Database**: back up Postgres regularly (`pg_dump`). If using the bundled
  Docker Postgres, its data lives in the `pgdata` Docker volume.
- **Secrets**: `NEXTAUTH_SECRET` and `FIELD_ENCRYPTION_KEY` live only in `.env`.
  Losing `FIELD_ENCRYPTION_KEY` makes stored MFA secrets undecryptable (users
  must re-enroll). In production, manage them via a secrets manager/KMS, not a
  plain file.
- See [SECURITY.md](./SECURITY.md) for the technical safeguards and known gaps
  (rate limiting, CSP, dependency scanning) to address before public exposure.

---

## Troubleshooting

- **`curl : A parameter cannot be found that matches parameter name 'fsSL'`** —
  you're in Windows PowerShell, not the box. These are Linux commands; run them
  in the SSH session on the Ubuntu box.
- **`docker` permission denied** — you didn't log out/in after `usermod -aG
  docker`. Reconnect, or run `newgrp docker`.
- **Login redirects to the wrong URL / fails** — `NEXTAUTH_URL` doesn't match the
  address in the browser. Fix it in `.env` and restart the service.
- **`iconv-lite` build warning** — harmless; it's an optional dependency of the
  PDF library. Ignore it.
- **Port 3000 already in use** — set `PORT` (e.g. `Environment=PORT=3001` in the
  service, and update the Nginx `proxy_pass`).
