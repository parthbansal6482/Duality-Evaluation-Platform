# 🚀 Deployment Guide: College Personal Server + Vercel (Best Approach)

This is the recommended production setup for your project:
- **Frontend (`dualityFrontend`)** on **Vercel**
- **Backend (`dualityBackend`)** on your **college personal server**
- **MongoDB + Redis + Worker** on the same server using Docker Compose
- **Only one public backend URL** exposed over HTTPS (example: `https://api.yourdomain.com`)

This gives you the best balance of reliability, low cost, and easy scaling for student projects.

## ✅ Best Architecture (Recommended)
1. **Vercel hosts frontend** and serves static assets fast globally.
2. **College server runs backend stack** (API + worker + MongoDB + Redis) in Docker.
3. **Nginx/Caddy reverse proxy** on the server terminates HTTPS and forwards to API container.
4. **Database and Redis stay private** (do not expose ports publicly).

Why this is best:
- frontend deploys are instant through Git pushes
- backend remains fully under your control
- safer networking (only API public)
- easier debugging because all backend services are on one machine

## ❓No Domain? Use This Instead
If you do **not** own a domain yet, deploy like this:
- Frontend: use your default Vercel URL (example: `https://your-app.vercel.app`)
- Backend: use your server public IP + API port (example: `http://<server-ip>:5001/api`)

Set environment values:
- Backend `CLIENT_URL=https://your-app.vercel.app`
- Frontend `VITE_API_URL=http://<server-ip>:5001/api`

Important:
- This works for testing/small private usage.
- It is **not ideal for production OAuth** and browser security because backend is HTTP.
- Best next step is to get a free/cheap domain and put HTTPS on backend (`https://api.yourdomain.com`).

---

## 🏗️ System Overview
1. **Frontend**: React/Vite app (`dualityFrontend`) on Vercel
2. **API Server**: Node.js/Express on college server
3. **Execution Worker**: Code execution service on college server
4. **Data Layer**: MongoDB + Redis on college server (private network only)

---

## 🛠️ Phase 1: Prepare College Server
Assume Ubuntu 22.04+ on your personal college server account.

### 1. Connect to server
```bash
ssh <your-user>@<college-server-ip>
```

### 2. Install Docker + Compose
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-v2 -y
sudo usermod -aG docker $USER
```
Log out and log back in once after adding Docker group.

### 3. Open required firewall ports
- `22` for SSH
- `80` and `443` for HTTP/HTTPS
- **Do not open MongoDB/Redis ports** (`27017`, `6379`) publicly

---

## 🔐 Phase 2: Clone and Configure Environment
```bash
git clone https://github.com/parthbansal6482/Duality-Evaluation-Platform.git
cd Duality-Evaluation-Platform
```

### Backend `.env` (`dualityBackend/.env`)
```bash
cd dualityBackend
cp .env.example .env
nano .env
```

Set/verify:
- `MONGODB_COMPETITION_URI=mongodb://mongodb:27017/duality`
- `MONGODB_DUALITY_URI=mongodb://mongodb:27017/duality-extended`
- `ALLOW_SHARED_MONGODB=false` (recommended safety default)
- `STRICT_DB_BOUNDARIES=true` (recommended; blocks startup when collections are mixed)
- `REDIS_URL=redis://redis:6379`
- `JWT_SECRET=<long-random-secret>`
- `GOOGLE_CLIENT_ID=<google-oauth-client-id>`
- `CLIENT_URL=https://<your-vercel-domain-or-custom-domain>`

Mapping:
- **Competition / Duality Extended (team battles)** uses `MONGODB_COMPETITION_URI`
- **Assignments + Quizzes** uses `MONGODB_DUALITY_URI`

Boundary audit (optional but recommended before production):
```bash
cd dualityBackend
node scripts/audit-db-boundaries.js --strict
```

### Frontend env for Vercel
In Vercel project settings, set:
- `VITE_API_URL=https://api.<yourdomain.com>/api`
- `VITE_GOOGLE_CLIENT_ID=<same-google-client-id>`

---

## 🚢 Phase 3: Start Backend Stack on Server
From `dualityBackend`:
```bash
docker compose up -d --build
docker compose ps
```

This should start:
- API server
- execution worker
- mongodb
- redis

---

## 🌐 Phase 4: Put Reverse Proxy + HTTPS in Front of API
Use **Nginx** or **Caddy** on the college server.

Minimum target:
- Public URL: `https://api.<yourdomain.com>`
- Proxy to API container internal port (for example `localhost:5000`)
- Enforce HTTPS

If your college network does not allow direct inbound traffic on `80/443`, use one of:
1. College-approved reverse proxy/domain mapping
2. Cloudflare Tunnel
3. Tailscale Funnel (if policy allows)

If you have **no domain**, you can skip reverse proxy initially and expose `5001` directly:
- API URL becomes `http://<server-ip>:5001/api`
- Keep this as temporary setup only

---

## ▲ Phase 5: Deploy Frontend on Vercel
1. Import GitHub repo in Vercel.
2. Set **Framework Preset** = `Vite`.
3. Set **Root Directory** = `dualityFrontend`.
4. Add env vars from Phase 2.
5. Deploy.

After deployment, copy your Vercel URL (or custom frontend domain) and ensure backend `CLIENT_URL` matches it.

---

## 🛡️ Phase 6: Google OAuth Production Setup
In Google Cloud Console:
1. Go to **APIs & Services > Credentials**
2. Add frontend URL to **Authorized JavaScript origins**
- `https://<your-vercel-domain-or-custom-domain>`
3. Add backend callback to **Authorized redirect URIs**
- `https://api.<yourdomain.com>/api/auth/google/callback`

Also verify the same domains are used in app env files.

If you are on the **no-domain temporary setup**:
1. Use your Vercel URL in Authorized JavaScript origins  
   - `https://your-app.vercel.app`
2. Try adding callback with server IP  
   - `http://<server-ip>:5001/api/auth/google/callback`

Note: Google OAuth may reject some insecure/non-domain callback setups depending on policy. If that happens, move to a real domain + HTTPS backend.

---

## 🔄 Recommended CI/CD Flow
1. Push code to GitHub.
2. **Frontend** auto-deploys from Vercel.
3. **Backend** deploys on server with:
```bash
cd ~/Duality-Evaluation-Platform/dualityBackend
git pull
docker compose up -d --build
```

Optional: add GitHub Actions for SSH-based backend deploy.

---

## 🩺 Troubleshooting
- API logs: `docker compose logs -f api-server`
- Worker logs: `docker compose logs -f execution-worker`
- Mongo logs: `docker compose logs -f mongodb`
- Restart backend services: `docker compose restart`
- Container status: `docker compose ps`

---

> [!IMPORTANT]
> Keep MongoDB and Redis private, expose only the API over HTTPS, and set strict CORS to your Vercel frontend domain. This is the safest and cleanest production model for your college server + Vercel setup.
