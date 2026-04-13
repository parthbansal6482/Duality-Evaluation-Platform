# Production Deployment Guide 🚀

This document provides step-by-step instructions for hosting the DSA Coding Contest Platform in a production environment (e.g., AWS EC2, DigitalOcean, or any Linux server with Docker).

---

## 1. Prerequisites

- **Server**: Linux (Ubuntu 22.04 recommended)
- **Node.js**: v18 or later
- **Docker**: Installed and running
- **MongoDB**: MongoDB Atlas (recommended) or a local MongoDB instance

---

## 2. Infrastructure Setup

### 🐳 Build the Code Executor
The platform requires a specialized Docker image to safely execute user code.
```bash
cd server/docker
./build-executor.sh
```
Verify the image exists: `docker images | grep code-executor`

### 🔑 Environment Variables
Create the production `.env` files based on the provided examples.

**Backend (`server/.env`):**
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_long_random_secret_key
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

**Frontend (`.env`):**
```env
VITE_API_URL=https://your-backend-api-domain.com/api
```

---

## 3. Server Deployment

### 🏗️ Backend
1. Install dependencies: `cd server && npm install`
2. Start the server: `npm start`
   - *Recommendation: Use a process manager like `pm2` to keep the server running.*
   - `npm install -g pm2`
   - `pm2 start src/server.js --name contest-api`

### 🎨 Frontend
1. Install dependencies: `npm install`
2. Build the project: `npm run build`
3. Serve the `build/` folder using Nginx or a similar static host.

---

## 4. Security Recommendations

- **CORS**: Ensure `ALLOWED_ORIGINS` strictly contains only your production frontend domain.
- **Docker**: Do **not** run the contest backend as root if possible. Ensure the Docker daemon is accessible by the user running the Node.js server.
- **SSL**: Always use HTTPS for both the frontend and API. Use Cloudflare or Let's Encrypt.
- **Secrets**: Rotate `JWT_SECRET` periodically to ensure session security.

---
 
## 5. Post-Deployment Steps

1. **Login as Admin**: Access the `/admin` route to set up your first round.
2. **Add Questions**: Create questions through the dashboard, ensuring each has valid hidden test cases.
3. **Verify Execution**: Submit a "dummy" solution to confirm that the backend can successfully launch Docker containers and return results.

Happy Hosting! 🏆
