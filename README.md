# 🚀 Duality Evaluation Platform

Duality is a comprehensive, distributed evaluation platform designed for universities and coding competitions. It provides a secure, real-time environment for hosting coding battles, academic assignments, and quizzes with automated code execution and evaluation.

## 🏗️ System Architecture

The platform follows a **3-Tier Distributed Architecture**:

1.  **Frontend**: A modern, responsive React/Vite application built with TypeScript, Tailwind CSS, and Shadcn UI.
2.  **API Server**: A robust Node.js/Express backend handling authentication, database management, and real-time coordination via Socket.IO.
3.  **Execution Worker**: A dedicated service (BullMQ-powered) responsible for the safe and isolated execution of user-submitted code inside Docker containers.
4.  **Data Layer**: Powered by MongoDB for persistent data and Redis for high-speed caching, queuing, and real-time event distribution.

## 🌟 Key Features

-   **Dual Modes**:
    -   **Duality Extended (Battle Mode)**: Real-time competitive coding for teams and individuals.
    -   **Academic Mode**: Streamlined management for class assignments and timed quizzes.
-   **Automated Evaluation**: Instant feedback for students with support for multiple languages and custom test cases.
-   **Secure Sandbox**: Code execution is fully isolated using Docker to ensure system stability and security.
-   **Real-time Leaderboard**: Dynamic updates via WebSockets for a competitive and engaging experience.
-   **Auto-Cohort Management**: Intelligent year detection from university email domains.
-   **Rich Admin Dashboard**: Comprehensive controls for question bank management, assignment delivery, and student performance tracking.

## 🛠️ Tech Stack

### Frontend
-   **Framework**: React 18 with Vite
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS 4.0, Lucide React
-   **Components**: Radix UI (via Shadcn), Monaco Editor
-   **State/Real-time**: Axios, Socket.IO Client

### Backend
-   **Runtime**: Node.js
-   **Framework**: Express
-   **Database**: MongoDB (via Mongoose)
-   **Cache/Queue**: Redis (via ioredis & BullMQ)
-   **Real-time**: Socket.IO with Redis Adapter
-   **Security**: Google OAuth 2.0, JWT, Express Rate Limit, bcryptjs

## 🚀 Getting Started

### Prerequisites

-   Node.js (v18+)
-   Docker and Docker Compose
-   MongoDB and Redis instances (or use the provided Docker stack)

### Quick Start (Local Development)

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/parthbansal6482/Duality-Evaluation-Platform.git
    cd Duality-Evaluation-Platform
    ```

2.  **Setup the Backend**:
    ```bash
    cd dualityBackend
    npm install
    cp .env.example .env # Configure your MongoDB, Redis, and Google OAuth credentials
    npm run dev
    ```

3.  **Setup the Frontend**:
    ```bash
    cd ../dualityFrontend
    npm install
    cp .env.example .env # Configure VITE_API_URL and VITE_GOOGLE_CLIENT_ID
    npm run dev
    ```

## 🚢 Deployment

For professional production deployment, we recommend the **Hybrid Architecture**:
-   **Frontend**: Hosted on [Vercel](https://vercel.com) for global CDN delivery.
-   **Backend**: Hosted on a **Linux Server** (e.g., College Personal Server) using Docker Compose.

Refer to the [Detailed Deployment Guide](docs/deployment.md) for step-by-step instructions.

## 📜 License

This project is licensed under the ISC License.

---

Built with ❤️ for student evaluation and competitive excellence.
