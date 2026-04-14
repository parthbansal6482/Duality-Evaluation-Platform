# 🚀 Deployment Guide: Duality Evaluation Platform

Welcome! This guide will take you through the process of deploying the **Duality Evaluation Platform** from scratch. We have designed this to be as simple as possible, assuming you are new to deployment.

## 🏗️ System Overview
The platform uses a **3-Tier Distributed Architecture**:
1.  **Frontend**: The website users interact with (React/Vite).
2.  **API Server**: The "Brain" that handles requests and the database (Node.js/Express).
3.  **Execution Worker**: The "Muscle" that runs user code safely in isolated containers.
4.  **Database & Cache**: MongoDB (Data) and Redis (Coordination).

---

## 🛠️ Phase 1: Preparation
To host this platform, you need a **Virtual Private Server (VPS)**. We recommend Ubuntu 22.04 LTS (available on AWS, DigitalOcean, Vultr, etc.).

### 1. Connect to your server
Use a "Terminal" app to log in:
```bash
ssh root@your_server_ip
```

### 2. Install Docker (The "One-Tool" Solution)
Docker allows us to run the entire backend with a single command. Run these on your server:
```bash
# Update your server
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-v2 -y
```

---

## 🔑 Phase 2: The "Secret Sauce" (Environment Variables)
Variables tell the code where the database is and how to behave.

### 1. Clone the Code
```bash
git clone https://github.com/parthbansal6482/Duality-Evaluation-Platform.git
cd Duality-Evaluation-Platform
```

### 2. Set up Backend Variables
Create a `.env` file in `dualityBackend`:
```bash
cd dualityBackend
cp .env.example .env
nano .env
```
**Update these values:**
- `MONGODB_URI`: Leave as `mongodb://mongodb:27017/duality` (Docker handles this!).
- `REDIS_URL`: Leave as `redis://redis:6379`.
- `JWT_SECRET`: Type a long random string of characters.
- `GOOGLE_CLIENT_ID`: Get this from the [Google Cloud Console](https://console.cloud.google.com/).
- `CLIENT_URL`: The URL where your frontend will live (e.g., `https://duality.yourdomain.com`).

### 3. Set up Frontend Variables
```bash
cd ../dualityFrontend
cp .env.example .env
nano .env
```
- `VITE_API_URL`: The URL of your backend (e.g., `https://api.yourdomain.com/api`).
- `VITE_GOOGLE_CLIENT_ID`: Must match the one in the backend.

---

## 🚢 Phase 3: Launching the Engines (Docker Compose)
Now, we launch the Database, Redis, API, and Worker all at once.

1.  Navigate back to the backend folder:
    ```bash
    cd ../dualityBackend
    ```
2.  **Fire it up!**
    ```bash
    docker compose up -d --build
    ```
    *This command builds the containers and runs them in the background.*

---

## 🌐 Phase 4: Deploying the Frontend
The frontend is a "Static Site," meaning it doesn't need a persistent server.

### Option A: Vercel/Netlify (Recommended for Beginners)
1.  Connect your GitHub repo to **Vercel** or **Netlify**.
2.  Set the Framework Preset to **Vite**.
3.  Set the Root Directory to `dualityFrontend`.
4.  Add your Environment Variables from Phase 2.
5.  Click **Deploy**.

### Option B: Manual Upload
1.  On your local machine, run `npm run build` inside `dualityFrontend`.
2.  Take the files inside the `dist` folder and upload them to any host (like GitHub Pages or a simple Nginx server).

---

## 🛡️ Phase 5: Google OAuth Setup
Users can't log in unless Google knows about your deployment.

1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Navigate to **APIs & Services > Credentials**.
3.  Add your production URL to **Authorized JavaScript Origins**.
4.  Add `https://your-api-url.com/api/auth/google/callback` to **Authorized Redirect URIs**.

---

## 🩺 Troubleshooting
- **Check Backend Logs**: `docker compose logs -f api-server`
- **Check Worker Logs**: `docker compose logs -f execution-worker`
- **Database Restart**: `docker compose restart mongodb`

> [!IMPORTANT]
> **A Note on Security**: Always use HTTPS for production. You can use services like **Cloudflare** or **Nginx Proxy Manager** to add SSL (the "lock" icon) to your domain for free.
