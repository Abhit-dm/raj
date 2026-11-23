# Deploying RajWorthman on a VPS

Tested target: **Ubuntu 22.04 / 24.04**, run as a sudo user.

### This demo server

| | |
|---|---|
| Server IP | `187.77.178.120` |
| RajWorthman URL | **`http://187.77.178.120:8080`** (website + app download) |
| API used by the app | `http://187.77.178.120:8080/api` |
| Domain | `client-demo`: needs a full name (e.g. `client-demo.example.com`) with a DNS A record pointing to `187.77.178.120` before HTTPS can be enabled |

> ⚠️ This server already hosts another site ("HMS CareDesk") on ports 80/443. RajWorthman runs on **port 8080**
> so the two don't clash. **Do not remove or edit the other site's Nginx config.**

Replace `CHANGE_ME_STRONG_DB_PASSWORD` everywhere with the output of `openssl rand -base64 24`.

---

## 1. PostgreSQL

### 1.1 Install

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
psql --version
```

### 1.2 Create the database and app user

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE rajworthman WITH LOGIN PASSWORD 'CHANGE_ME_STRONG_DB_PASSWORD';
CREATE DATABASE rajworthman_db OWNER rajworthman ENCODING 'UTF8' TEMPLATE template0;
REVOKE ALL ON DATABASE rajworthman_db FROM PUBLIC;
GRANT ALL PRIVILEGES ON DATABASE rajworthman_db TO rajworthman;
\c rajworthman_db
ALTER SCHEMA public OWNER TO rajworthman;
GRANT ALL ON SCHEMA public TO rajworthman;
SQL
```

Check that it works:

```bash
psql "postgresql://rajworthman:CHANGE_ME_STRONG_DB_PASSWORD@localhost:5432/rajworthman_db" -c "SELECT current_user, current_database();"
```

### 1.3 Keep the database private

PostgreSQL on Ubuntu listens only on `localhost` by default, which is what we want: the API runs on the same server. Confirm it:

```bash
sudo -u postgres psql -c "SHOW listen_addresses;"   # should be: localhost
sudo ufw status                       # if ufw is active, open the RajWorthman port:
sudo ufw allow 8080/tcp               # 5432 stays closed
# Also open TCP 8080 in your VPS provider's firewall / security group, if it has one.
```

### 1.4 Create the tables

**Option A (recommended): Prisma migrations**, run from the backend folder after step 3:

```bash
cd /var/www/rajworthman/backend
npx prisma migrate deploy
```

**Option B: plain SQL.** `deploy/schema.sql` creates all 15 tables, the enums and the indexes:

```bash
psql "postgresql://rajworthman:CHANGE_ME_STRONG_DB_PASSWORD@localhost:5432/rajworthman_db" -f deploy/schema.sql
# Tell Prisma the schema is already applied, so future `migrate deploy` runs don't recreate it:
cd /var/www/rajworthman/backend && npx prisma migrate resolve --applied 20261120121138_init
```

### 1.5 Daily backups

```bash
sudo mkdir -p /var/backups/rajworthman && sudo chown postgres /var/backups/rajworthman
sudo -u postgres crontab -l 2>/dev/null | { cat; echo '30 2 * * * pg_dump -Fc rajworthman_db > /var/backups/rajworthman/db-$(date +\%F).dump && find /var/backups/rajworthman -name "*.dump" -mtime +14 -delete'; } | sudo -u postgres crontab -
# Restore: sudo -u postgres pg_restore -d rajworthman_db --clean /var/backups/rajworthman/db-YYYY-MM-DD.dump
```

---

## 2. Node.js, PM2 and Nginx

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx git
sudo npm install -g pm2
```

## 3. Get the code

```bash
sudo mkdir -p /var/www && sudo chown $USER /var/www
git clone https://github.com/Abhit-dm/raj.git /var/www/rajworthman
cd /var/www/rajworthman
```

### 3.1 Backend

```bash
cd /var/www/rajworthman/backend
cp .env.example .env
nano .env
```

Set at least:

```env
DATABASE_URL="postgresql://rajworthman:CHANGE_ME_STRONG_DB_PASSWORD@localhost:5432/rajworthman_db"
JWT_SECRET="<openssl rand -hex 48>"
JWT_REFRESH_SECRET="<a different openssl rand -hex 48>"
ADMIN_SETUP_SECRET="<openssl rand -hex 24>"
NODE_ENV="production"
PORT=3001
CORS_ORIGIN="http://187.77.178.120:8080,http://localhost,capacitor://localhost"
```

```bash
npm ci
npx prisma generate
npx prisma migrate deploy        # creates the tables (section 1.4)
npm run build
mkdir -p uploads downloads
pm2 start dist/server.js --name rajworthman-api
pm2 save && pm2 startup          # run the command it prints, so the API restarts on reboot
curl http://localhost:3001/api/health
```

### 3.2 Frontend (website)

```bash
cd /var/www/rajworthman/frontend
echo "VITE_API_URL=/api" > .env
npm ci
npm run build                    # output: frontend/dist
```

### 3.3 Put the Android app on the server (the "Download App" button)

The website downloads the app from `http://187.77.178.120:8080/downloads/RajWorthman-latest.apk`.
Upload the APK from your PC:

```bash
scp release/RajWorthman-v0.0.1.apk user@SERVER_IP:/var/www/rajworthman/backend/downloads/RajWorthman-latest.apk
```

> The APK in `release/` is already built for this server (`VITE_API_URL=http://187.77.178.120:8080/api` in
> `frontend/.env.android`). If the address changes, update that file and run `npm run apk` in `frontend`.

## 4. Nginx

```bash
sudo cp /var/www/rajworthman/deploy/nginx-rajworthman.conf /etc/nginx/sites-available/rajworthman
sudo ln -s /etc/nginx/sites-available/rajworthman /etc/nginx/sites-enabled/rajworthman
sudo nginx -t && sudo systemctl reload nginx      # nginx -t must say "ok" before reloading
curl http://187.77.178.120:8080/api/health
```

Leave the existing `default` / HMS CareDesk sites in `sites-enabled` as they are.

### 4.1 Later: HTTPS on a real domain

When the full domain (e.g. `client-demo.example.com`) has a DNS **A record** for `187.77.178.120`:

1. In `/etc/nginx/sites-available/rajworthman`, change `listen 8080;` to `listen 80;` (and `[::]:80`) and set
   `server_name client-demo.example.com;`. Nginx routes by name, so this doesn't clash with the other site.
2. `sudo nginx -t && sudo systemctl reload nginx`
3. `sudo apt install -y certbot python3-certbot-nginx && sudo certbot --nginx -d client-demo.example.com`
4. Update `CORS_ORIGIN` in `backend/.env` to `https://client-demo.example.com,...`, then `pm2 restart rajworthman-api`.
5. Set `VITE_API_URL=https://client-demo.example.com/api` in `frontend/.env.android`, run `npm run apk`, and upload the new APK.

## 5. Create the first admin (once)

```bash
curl -X POST http://187.77.178.120:8080/api/admin/seed \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rajworthman.com","password":"<strong password>","secret":"<ADMIN_SETUP_SECRET from .env>"}'
```

## 6. Updating to a new version

```bash
cd /var/www/rajworthman && git pull
cd backend && npm ci && npx prisma migrate deploy && npm run build && pm2 restart rajworthman-api
cd ../frontend && npm ci && npm run build
# new APK: scp it to backend/downloads/RajWorthman-latest.apk
```
