# DSA Contest Platform - Backend Server

Backend API for the DSA Contest Platform built with Node.js, Express, and MongoDB.

## Features

- 🔐 JWT-based authentication
- 👥 Team registration with 2-3 member validation
- ✅ Admin approval workflow for teams
- 🔒 Role-based access control (Admin/Team)
- ✨ Input validation and error handling

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

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

### Create initial admin account:
```bash
npm run seed
```

This will create an admin account with:
- Email: `admin@contest.com`
- Password: `admin123`

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
server/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   ├── Admin.js             # Admin model
│   │   └── Team.js              # Team model
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   └── validation.js        # Request validation
│   ├── routes/
│   │   ├── admin.routes.js
│   │   ├── team.routes.js
│   │   └── teamManagement.routes.js
│   ├── controllers/
│   │   ├── admin.controller.js
│   │   ├── team.controller.js
│   │   └── teamManagement.controller.js
│   ├── utils/
│   │   ├── jwt.js               # JWT utilities
│   │   └── seed.js              # Database seeding
│   └── server.js                # Main server file
├── .env
├── .env.example
├── .gitignore
└── package.json
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
| `MONGODB_URI` | MongoDB URI for Contest Platform | - |
| `MONGODB_PRACTICE_URI` | MongoDB URI for Practice Platform | - |
| `JWT_SECRET` | Secret key for JWT | - |
| `JWT_EXPIRE` | JWT expiration time | `7d` |
| `CLIENT_URL` | Primary Frontend URL | `http://localhost:5173` |
| `ALLOWED_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173,http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | - |

## License

ISC
