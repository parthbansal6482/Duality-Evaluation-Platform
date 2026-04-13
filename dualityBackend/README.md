# Duality Evaluation Platform - Backend

The core API for the Duality Evaluation Platform. This backend is designed for high-concurrency college evaluations, supporting 200–500+ students via a distributed architecture.

## Architecture

This platform uses a **3-tier distributed architecture** for maximum stability under heavy load:

1.  **Frontend (Vercel)**: React-based student and admin interface.
2.  **API Server (Dedicated Node.js)**: Handles authentication, database, and real-time Socket.IO synchronization.
3.  **Execution Workers (Docker Host)**: Isolated servers that process code execution jobs from a Redis queue.

## Features

- 🔐 **Google OAuth**: Integrated `@bmu.edu.in` authentication.
- ⚡ **Asynchronous Execution**: Submissions are queued via **Redis & BullMQ** to prevent API hangs.
- 🐳 **Isolated Judge**: Dockerized code execution for Python, C, C++, and Java.
- 📊 **Real-time Leaderboard**: Instant updates via Socket.IO with Redis adapter.
- 🛡️ **Rate Limiting**: Distributed rate limiting to prevent system abuse.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

## Deployment

### 1. Unified Deployment (Local/Small Lab)
Runs the API and the Worker in the same process. Good for testing or batches < 50 students.
```bash
# Set .env: START_WORKER=true and NODE_ENV=development
npm run dev
```

### 2. Distributed Deployment (Recommended for Batch Evaluations)
Scale the API and Workers independently.

#### API Server
```bash
export START_WORKER=false
node src/server.js
```

#### Execution Worker
```bash
node src/worker.js
```

### 3. Docker Compose (Quick Start)
Spins up MongoDB, Redis, API, and Worker automatically.
```bash
docker-compose up --build
```

## API Endpoints

### Admin Routes

#### POST `/api/admin/signup`
Register a new admin
```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "password123"
}
```

#### POST `/api/admin/login`
Admin login
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

#### GET `/api/admin/profile`
Get admin profile (requires authentication)
```
Headers: Authorization: Bearer <token>
```

### Team Routes

#### POST `/api/team/register`
Register a new team (2-3 members required)
```json
{
  "teamName": "Code Warriors",
  "password": "team123",
  "members": [
    { "name": "John Doe", "email": "john@example.com" },
    { "name": "Jane Smith", "email": "jane@example.com" }
  ]
}
```

#### POST `/api/team/login`
Team login (only approved teams can login)
```json
{
  "teamName": "Code Warriors",
  "password": "team123"
}
```

#### GET `/api/team/profile`
Get team profile (requires authentication)
```
Headers: Authorization: Bearer <token>
```

### Team Management Routes (Admin Only)

#### GET `/api/teams?status=pending`
Get all teams (optional status filter: pending/approved/rejected)
```
Headers: Authorization: Bearer <admin_token>
```

#### PUT `/api/teams/:teamId/approve`
Approve a team
```
Headers: Authorization: Bearer <admin_token>
```

#### PUT `/api/teams/:teamId/reject`
Reject a team
```
Headers: Authorization: Bearer <admin_token>
```

## Project Structure

```
dualityBackend/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   └── redis.js             # Redis connection (BullMQ)
│   ├── queues/
│   │   └── submission.queue.js  # BullMQ Producer
│   ├── services/
│   │   ├── dualitySubmissionQueue.js # BullMQ Worker
│   │   └── execution.service.js      # Docker Execution
│   ├── middleware/
│   │   ├── dualityAuth.js       # Student/Admin Auth
│   │   └── rateLimiter.js       # Redis-based Rate Limiting
│   ├── routes/
│   │   └── duality/             # Duality Evaluation Routes
│   ├── controllers/
│   │   └── duality/             # Logic for auth, questions, submissions
│   ├── server.js                # API Entry Point
│   └── worker.js                # Worker Entry Point
├── docker/
│   ├── Dockerfile.server        # API Server Image
│   ├── Dockerfile.worker        # Worker Image
│   └── build-executor.sh        # Script to build judge image
├── docker-compose.yml           # Full stack orchestrator
└── .env.example
```

## Testing with cURL

### Create Admin:
```bash
curl -X POST http://localhost:5000/api/admin/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Admin","email":"test@admin.com","password":"admin123"}'
```

### Register Team:
```bash
curl -X POST http://localhost:5000/api/team/register \
  -H "Content-Type: application/json" \
  -d '{"teamName":"Test Team","password":"team123","members":[{"name":"John","email":"john@test.com"},{"name":"Jane","email":"jane@test.com"}]}'
```

### Admin Login:
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@contest.com","password":"admin123"}'
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode (`development`/`production`) | `development` |
| `PORT` | Server port | `5001` |
| `MONGODB_URI` | MongoDB URI for Duality Evaluation Platform | - |
| `JWT_SECRET` | Secret key for JWT | - |
| `JWT_EXPIRE` | JWT expiration time | `7d` |
| `CLIENT_URL` | Primary Frontend URL | `http://localhost:5173` |
| `ALLOWED_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173,http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | - |

## License

ISC
