require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createAdapter } = require('@socket.io/redis-adapter');
const connection = require('./config/redis');
const { connectDB } = require('./config/database');
const { connectExtendedDB } = require('./config/extendedDatabase');
const { assertMongoSeparation } = require('./config/dbUris');
const { ensureCompetitionBootstrapAdmins } = require('./utils/ensureCompetitionBootstrapAdmins');
const path = require('path');
const fs = require('fs');
const { assertStrictCollectionBoundaries } = require('./config/dbBoundaries');
const { apiLimiter } = require('./middleware/rateLimiter');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { protect, adminOnly } = require('./middleware/dualityAuth');

const {
    initializeSocket,
    // Extended Competition
    getLeaderboardData,
    broadcastCheatingViolation,
    isTeamActive,
    addActiveTeam,
    removeActiveTeam,
    // Duality Extended (Practice/Assignments mode)
    addDualityUser,
    removeDualityUser,
} = require('./socket');

// ── Extended Competition Routes ──────────────────────────────────────────────
const adminRoutes = require('./routes/admin.routes');
const teamRoutes = require('./routes/team.routes');
const teamManagementRoutes = require('./routes/teamManagement.routes');
const statsRoutes = require('./routes/stats.routes');
const questionRoutes = require('./routes/question.routes');
const roundRoutes = require('./routes/round.routes');
const submissionRoutes = require('./routes/submission.routes');
const settingsRoutes = require('./routes/settings.routes');

// ── Duality Extended / Quiz Routes ───────────────────────────────────────────
const dualityAuthRoutes = require('./routes/duality/dualityAuth.routes');
const dualityAllowedEmailRoutes = require('./routes/duality/dualityAllowedEmail.routes');
const dualityQuestionRoutes = require('./routes/duality/dualityQuestion.routes');
const dualitySubmissionRoutes = require('./routes/duality/dualitySubmission.routes');
const dualitySettingsRoutes = require('./routes/duality/dualitySettings.routes');
const quizRoutes = require('./routes/duality/quiz.routes');
const dualityImportRoutes = require('./routes/duality/dualityImport.routes');

// ── App setup ────────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// CORS configuration
const allowedOrigins = [
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : []),
    process.env.CLIENT_URL,
    'https://dualityacm.bmu.edu.in',
    'http://dualityacm.bmu.edu.in',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5001',
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// ── Socket.IO with Redis adapter ─────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: "*", // RELAXED FOR DIAGNOSIS
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true
    }
});

// Diagnostic Engine Logging
io.engine.on("connection_error", (err) => {
    console.error(`[SocketEngine] Handshake Error: ${err.code} - ${err.message}`);
    console.error(`[SocketEngine] Request context: ${JSON.stringify(err.context)}`);
});

const pubClient = connection;
const subClient = connection.duplicate();

subClient.on('error', (err) => {
    console.error('[Redis Sub] Connection error:', err);
});

io.adapter(createAdapter(pubClient, subClient));

// Initialize socket utility
initializeSocket(io);

// Socket.IO connection handler
io.on('connection', async (socket) => {
    console.log('Client connected:', socket.id);

    // Send current leaderboard on connection (Extended)
    try {
        const leaderboard = await getLeaderboardData();
        socket.emit('leaderboard:update', leaderboard);
    } catch (error) {
        console.error('[Socket] Error sending initial leaderboard:', error);
    }

    // Extended: team session authentication
    socket.on('team:authenticate', (token) => {
        try {
            const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
            if (decoded && decoded.type === 'team') {
                const teamId = decoded.id;
                addActiveTeam(teamId, socket.id);
                socket.join(`team:${teamId}`);
                console.log(`[Socket] Team authenticated and joined room: team:${teamId}`);
            }
        } catch (error) {
            console.error('[Socket] Team auth error:', error);
        }
    });

    // Extended: cheating violations reported by clients
    socket.on('cheating:violation', ({ teamName, roundName, violationType, action, duration }) => {
        console.log(`Violation: ${teamName} - ${violationType} (${action}) in ${roundName}`);
        broadcastCheatingViolation(teamName, roundName, violationType, action, duration);
    });

    // Duality Extended: user authentication
    socket.on('duality:authenticate', (token) => {
        try {
            const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
            if (decoded && decoded.type === 'duality') {
                const userId = decoded.id;
                addDualityUser(userId, socket.id);
                socket.join(`user:${userId}`);
                console.log(`[Socket] Duality user authenticated and joined room: user:${userId}`);
            }
        } catch (error) {
            console.error('[Socket] Duality auth error:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        removeActiveTeam(socket.id);
        removeDualityUser(socket.id);
    });
});

// ── Request Logger & Static Files (Production) ──────────────────────────────
if (process.env.NODE_ENV === 'production') {
    const publicPath = path.join(process.cwd(), 'public');
    console.log(`[Server] Static file path: ${publicPath}`);
    
    // Request logger for debugging deployment build
    app.use((req, res, next) => {
        // Headers required for Google Login Popups with COOP/COEP
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
        
        if (!req.path.startsWith('/api')) {
            console.log(`[Web] ${req.method} ${req.path}`);
        }
        next();
    });

    app.use(express.static(publicPath));
}

// ── DB Admin Proxy (Must come BEFORE express.json) ───────────────────────────
// Only Super Admins can access the database manager.
const superAdminOnly = (req, res, next) => {
    if (!req.dualityUser || !req.dualityUser.isSuperAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Super Admin access required for Database Portal',
        });
    }
    next();
};

app.use(
    '/api/db-admin',
    protect,
    adminOnly,
    superAdminOnly,
    createProxyMiddleware({
        target: 'http://mongo-express:8081',
        changeOrigin: true,
        pathRewrite: {
            '^/api/db-admin': '', // remove base path when forwarding to Mongo Express
        },
        ws: true, // proxy websockets if needed
    })
);

// ── Middleware ────────────────────────────────────────────────────────────────
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes — Extended Competition ─────────────────────────────────────────────
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/team', apiLimiter, teamRoutes);
app.use('/api/teams', apiLimiter, teamManagementRoutes);
app.use('/api/stats', apiLimiter, statsRoutes);
app.use('/api/questions', apiLimiter, questionRoutes);
app.use('/api/rounds', apiLimiter, roundRoutes);
app.use('/api/submissions', apiLimiter, submissionRoutes);
app.use('/api/settings', apiLimiter, settingsRoutes);

// ── Routes — Duality Extended / Quiz ─────────────────────────────────────────
app.use('/api/duality/auth', apiLimiter, dualityAuthRoutes);
app.use('/api/duality/allowed-emails', apiLimiter, dualityAllowedEmailRoutes);
app.use('/api/duality/questions', apiLimiter, dualityQuestionRoutes);
app.use('/api/duality/submissions', apiLimiter, dualitySubmissionRoutes);
app.use('/api/duality/settings', apiLimiter, dualitySettingsRoutes);
app.use('/api/duality/quiz', apiLimiter, quizRoutes);
app.use('/api/duality/import', apiLimiter, dualityImportRoutes);

// ── Base API Health Check ───────────────────────────────────────────────────
app.get('/api', (req, res) => {
    res.status(200).json({ success: true, message: 'Duality API is online' });
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// ── Error handling ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// ── SPA Fallback (Production) ────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
    const publicPath = path.join(process.cwd(), 'public');
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ success: false, message: 'API route not found' });
        }
        res.sendFile(path.join(publicPath, 'index.html'), (err) => {
            if (err) {
                if (!req.path.includes('.')) {
                    console.error('[Server] SPA Fallback Error:', err.message);
                }
                res.status(500).json({ success: false, message: 'Frontend build not found' });
            }
        });
    });
} else {
    // 404 (Development/API only mode)
    app.use((req, res) => {
        res.status(404).json({ success: false, message: 'Route not found' });
    });
}

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Prevent accidental cross-mode data mixing.
        assertMongoSeparation();

        // Initialize connections to both databases
        const competitionConn = await connectDB();
        await ensureCompetitionBootstrapAdmins();
        
        // Connect duality DB (required for Assignments/Quiz features).
        const dualityConn = await connectExtendedDB();

        // Enforce hard collection boundaries by default.
        // Set STRICT_DB_BOUNDARIES=false only during migration/cleanup windows.
        const strictBoundaries = String(process.env.STRICT_DB_BOUNDARIES || 'true').toLowerCase() !== 'false';
        if (strictBoundaries) {
            await assertStrictCollectionBoundaries(competitionConn, dualityConn);
        }

        server.listen(PORT, () => {
            console.log('--- DUALITY PLATFORM: BUILD SUCCESSFUL ---');
            console.log('[System] Build: v2.5.0-distributed-sync (2026-04-17)');
            console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            console.log(`WebSocket server ready on port ${PORT}`);

            // Start background workers for code execution if configured
            if (process.env.START_WORKER === 'true' || process.env.NODE_ENV === 'development') {
                // Extended Competition Worker (Polling based)
                const submissionQueue = require('./services/submissionQueue');
                submissionQueue.start();
                console.log('[API] Extended Competition background worker started');

                // Duality Extended Worker (BullMQ based)
                const dualitySubmissionQueue = require('./services/dualitySubmissionQueue');
                dualitySubmissionQueue.start();
                console.log('[API] Duality Extended background worker started');
            } else {
                console.log('[API] Running in API-only mode (Distributed Workers expected)');
            }
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();
