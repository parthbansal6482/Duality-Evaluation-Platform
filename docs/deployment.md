# 🚀 Deployment Guide: Duality Evaluation Platform

This guide covers everything needed to deploy the Duality Evaluation Platform on a Linux server from scratch. The platform runs as a fully self-contained Docker stack — no manual builds or separate frontend server needed.

---

## 🏗️ Architecture Overview

```
Internet → [PORT 5001] → api-server (React UI + API)
                       → execution-worker (Code Runner)
                       → mongodb (Database)
                       → redis (Queue & Cache)
```

- **api-server**: Serves the React frontend as static files AND handles all API requests.
- **execution-worker**: Processes code submission jobs securely inside isolated sibling containers.
- **mongodb**: Primary database (password protected).
- **redis**: Message queue and cache for the worker.

---

## 🛠️ Step 1: Server Prerequisites

Run these commands on a fresh Ubuntu/Debian server:

```bash
# 1. Update the system
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Allow your user to run Docker without sudo
sudo usermod -aG docker $USER
newgrp docker

# 4. Verify Docker is working
docker --version
docker compose version
```

---

## 📥 Step 2: Clone the Repository

```bash
git clone https://github.com/parthbansal6482/Duality-Evaluation-Platform.git
cd Duality-Evaluation-Platform/dualityBackend
```

---

## 🔐 Step 3: Create the Backend `.env` File

This is the most critical step. Create a `.env` file inside the `dualityBackend` directory:

```bash
nano .env
```

Paste in the following template and fill in every value:

```env
# ─── Core ────────────────────────────────────────────────────────────────────
NODE_ENV=production
PORT=5001

# ─── MongoDB Authentication ───────────────────────────────────────────────────
# These are the root credentials that Docker uses to secure the database.
# Choose a strong password. Do NOT use special characters like @ in the password
# as it can break the URI parsing.
MONGO_ROOT_USERNAME=dualityAdmin
MONGO_ROOT_PASSWORD=YOUR_STRONG_PASSWORD_HERE

# These URIs are used by the application to connect to the database.
# Replace dualityAdmin and YOUR_STRONG_PASSWORD_HERE with the values above.
MONGODB_COMPETITION_URI=mongodb://dualityAdmin:YOUR_STRONG_PASSWORD_HERE@mongodb:27017/duality?authSource=admin
MONGODB_DUALITY_URI=mongodb://dualityAdmin:YOUR_STRONG_PASSWORD_HERE@mongodb:27017/duality-extended?authSource=admin
ALLOW_SHARED_MONGODB=true
STRICT_DB_BOUNDARIES=false

# ─── Redis ────────────────────────────────────────────────────────────────────
# No change needed. Redis runs on the internal Docker network.
REDIS_URL=redis://redis:6379

# ─── Security ─────────────────────────────────────────────────────────────────
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=REPLACE_WITH_A_VERY_LONG_RANDOM_STRING
JWT_EXPIRE=7d

# ─── CORS & Client URL ────────────────────────────────────────────────────────
# Set this to your server's IP and port (or your domain if you have one).
CLIENT_URL=http://YOUR_SERVER_IP:5001
ALLOWED_ORIGINS=http://YOUR_SERVER_IP:5001

# ─── Google OAuth ─────────────────────────────────────────────────────────────
# Get this from Google Cloud Console → APIs & Services → Credentials.
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
```

> **Tip**: Generate a secure JWT secret with this command:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## 🖥️ Step 4: Configure the Frontend `.env` File

The frontend has its own environment file at `dualityFrontend/.env`. These variables are **baked into the JavaScript bundle at build time** — they are not read at runtime.

> [!IMPORTANT]
> You must set these values **before** running `docker compose up --build`. If you change them afterwards, you must rebuild the images.

```bash
nano ../dualityFrontend/.env
```

```env
# ─── API URL ──────────────────────────────────────────────────────────────────
# In production (Docker), the frontend is served by the same server as the API.
# Use a relative path /api — the browser will automatically use the server's IP.
# Do NOT use http://localhost:5001/api here, it will only work on your laptop.
VITE_API_URL=/api

# ─── Google OAuth ─────────────────────────────────────────────────────────────
# Must match GOOGLE_CLIENT_ID in the backend .env exactly.
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
```

| Environment | `VITE_API_URL` value |
| :--- | :--- |
| **Local development** (`npm run dev`) | `http://localhost:5001/api` |
| **Production Docker** | `/api` |

---

## 🔑 Step 5: Configure Google OAuth

Before the login button will work on your server, you must authorize the new origin in the Google Cloud Console.

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Click your **OAuth 2.0 Client ID**.
3. Under **Authorized JavaScript Origins**, add:
   - `http://YOUR_SERVER_IP:5001`
4. Click **Save**.

---

## ⚙️ Step 6: Server-Specific `docker-compose.yml` Changes

Open `docker-compose.yml` and update the `execution-worker` section:

**1. Uncomment the socket volume mount:**
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

**2. Change the `DOCKER_HOST` variable:**
```yaml
- DOCKER_HOST=unix:///var/run/docker.sock
```

---

## 🚢 Step 7: First-Time Deployment

Run this from inside the `dualityBackend` directory. The first build takes **5–10 minutes** as it installs all dependencies and builds the React frontend.

```bash
docker compose up -d --build
```

**What this does:**
1. Builds the React frontend (Stage 1 of `Dockerfile`).
2. Packages it into the Node.js backend image.
3. Starts MongoDB with your root credentials.
4. Starts Redis.
5. Starts the API Server (waits for DB to be healthy first).
6. Starts the Execution Worker.

**Verify everything is running:**
```bash
docker compose ps
```
All services should show `Up` or `(healthy)`.

---

## 🌐 Step 8: Access the Platform

| Resource | URL |
| :--- | :--- |
| **Web App** | `http://YOUR_SERVER_IP:5001` |
| **API Base** | `http://YOUR_SERVER_IP:5001/api` |
| **MongoDB** (Compass) | `mongodb://dualityAdmin:YOUR_PASSWORD@YOUR_SERVER_IP:27017/duality?authSource=admin` |

---

## 🔄 Updating the Platform

To pull the latest code and redeploy:
```bash
git pull
docker compose up -d --build
```

---

## 🗄️ Managing the Database

### Run a database script on the server

```bash
# Run a script inside the running API container
docker exec -it dualitybackend-api-server-1 node scripts/YOUR_SCRIPT_NAME.js
```

### Backup the database

```bash
docker exec dualitybackend-mongodb-1 mongodump \
  --username dualityAdmin \
  --password YOUR_PASSWORD \
  --authenticationDatabase admin \
  --out /data/db/backup
```

---

## 🩺 Troubleshooting

| Problem | Command |
| :--- | :--- |
| View API logs | `docker compose logs -f api-server` |
| View Worker logs | `docker compose logs -f execution-worker` |
| View all logs | `docker compose logs -f` |
| Restart a service | `docker compose restart api-server` |
| Full restart | `docker compose down && docker compose up -d` |
| Wipe database & restart | `docker compose down -v && docker compose up -d` |
| Check container health | `docker compose ps` |

### Common Issues

**Problem**: `[GSI_LOGGER]: The given origin is not allowed`  
**Fix**: Add `http://YOUR_SERVER_IP:5001` to your Google Cloud Console Authorized JavaScript Origins.

**Problem**: `MongoServerError: Authentication failed`  
**Fix**: Your URI credentials don't match `MONGO_ROOT_USERNAME`/`MONGO_ROOT_PASSWORD`. Run `docker compose down -v` to wipe the DB volume, then restart with the correct credentials.

**Problem**: `connect ENOENT /var/run/docker.sock`  
**Fix**: Ensure the `volumes` mount in `docker-compose.yml` is uncommented for the `execution-worker` service.

**Problem**: Page loads but assets return 404  
**Fix**: Ensure `NODE_ENV=production` is set in your backend `.env`.

**Problem**: API calls fail after deployment  
**Fix**: Ensure `VITE_API_URL=/api` (not `http://localhost:...`) is set in `dualityFrontend/.env` before building.
