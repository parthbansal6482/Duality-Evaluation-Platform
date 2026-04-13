# DSA Coding Contest Platform

A full-stack platform with two products:
- **Duality**: LeetCode-style individual practice.
- **Duality Extended**: Team-based timed contests.

## 🚀 Features

## 📘 Duality (Practice) - Detailed

### Purpose
Continuous individual DSA practice with coding history, profile growth, and leaderboard ranking.

### Authentication
- Google OAuth login.
- Access limited to allowed institutional emails.
- Roles:
  - `student`: solve problems, view profile/history/leaderboard.
  - `admin`: manage question bank and monitor students.

### Student Features
- Problem list with filters:
  - Difficulty
  - Category
  - Search
- Per-question points by difficulty:
  - Easy = `100`
  - Medium = `200`
  - Hard = `300`
- Code solve page:
  - Run and Submit actions.
  - Multi-language support: Python, C, C++, Java.
  - Draft autosave (user + problem + language scoped) across refresh.
- Submission history table with pagination.
- Profile:
  - Solved ratios by difficulty.
  - Points and rank.
  - Recent activity with pagination.
- Student leaderboard tab (real-time updates).

### Admin Features
- Question management:
  - Add/Edit/Delete questions.
  - Difficulty/category/search filters.
  - Boilerplate, examples, test cases.
- Students tab:
  - Per-student solved stats, points, streak, last active.
  - Admin accounts excluded from student list.
- Leaderboard tab:
  - Real-time ranked students by points.

### Scoring & Ranking
- Total points:
  - `easySolved*100 + mediumSolved*200 + hardSolved*300`
- Rank tie-breakers:
  1. Higher points
  2. Higher solved count
  3. More recent activity

### Real-time Behavior
- Socket updates refresh:
  - submission outcomes
  - question updates
  - leaderboard/state views

## 🏆 Duality Extended (Contest) - Detailed

### Purpose
Run structured team contests with timed rounds, live standings, and tactical gameplay.

### Authentication & Security
- Admin dashboard for contest operators.
- Team registration (2–3 members) with approval flow.
- Single-device login protection for team accounts.
- JWT-protected APIs and role-based access.

### Contest Management
- Round creation/control (start/end/timing).
- Contest question bank with visible examples + hidden tests.
- Real-time leaderboard updates.
- System health and operational controls.

### Submission & Evaluation
- Docker sandbox execution.
- Multi-language runtime: Python, C, C++, Java.
- Queue-backed evaluation to smooth load.
- Resource caps (CPU + memory) per run.
- Status handling for WA/TLE/MLE/runtime errors.

### Tactical Mechanics
- Sabotage token system.
- Shield defense mechanics.
- Token shop and tactical actions during contest runtime.

## 🛠️ Tech Stack

### Frontend
- **React 18** (TypeScript, Vite)
- **Tailwind CSS** & **Radix UI**
- **Lucide React** (Icons)
- **Socket.io-client** (Real-time updates)

### Backend
- **Node.js** & **Express**
- **MongoDB** & **Mongoose**
- **Dockerode** (Docker API for Node.js)
- **Socket.io** (WebSocket server)

### Execution Environment
- **Docker**: Containerized execution for security.
- **Compilers**: OpenJDK 17, GCC/G++ 11, Python 3.

## 📦 Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (Atlas or Local)
- Docker (Installed and running)

### Setup Instructions

1. **Clone & Install**:
   ```bash
   git clone https://github.com/parthbansal6482/DSA-Coding-Contest-Platform.git
   cd DSA-Coding-Contest-Platform
   npm install
   cd server && npm install
   cd ..
   ```

2. **Configure Environment**:
   - **Backend**:
     ```bash
     cp server/.env.example server/.env
     ```
     Edit `server/.env` and fill in:
     - `MONGODB_URI`: Primary database for contest platform.
     - `MONGODB_PRACTICE_URI`: Separate database for individual practice.
     - `JWT_SECRET`: A long random string.
     - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.

   - **Frontend**:
     ```bash
     cp .env.example .env
     ```
     Edit `.env` and fill in:
     - `VITE_API_URL`: Set to `http://localhost:5001/api` for local dev.
     - `VITE_GOOGLE_CLIENT_ID`: Must match the backend ID.

3. **Build Code Executor (Docker)**:
   ```bash
   cd server/docker
   ./build-executor.sh
   cd ../..
   ```

4. **Run Application**:
   - **Backend**: `cd server && npm run dev`
   - **Frontend**: `npm run dev` (from root)

## 🔑 API Categories
- `/api/admin` - Admin Auth & Profile
- `/api/team` - Team Auth & Registration
- `/api/questions` - Problem Management
- `/api/rounds` - Contest Control
- `/api/submissions` - Code Evaluation & Leaderboard
- `/api/duality/auth` - Duality Google auth, profile, users, leaderboard
- `/api/duality/questions` - Duality question management
- `/api/duality/submissions` - Duality run/submit/history
- `/api/duality/allowed-emails` - Duality allowlist management

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License
This project is licensed under the ISC License.

## 👨‍💻 Author
**Parth Bansal** - [@parthbansal6482](https://github.com/parthbansal6482)
