require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createAdapter } = require('@socket.io/redis-adapter');
const connection = require('./config/redis');
const { connectDB } = require('./config/database');
const { connectExtendedDB } = require('./config/extendedDatabase');

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
    'http://localhost:3000',
    'http://localhost:5173',
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
const io = new Server(server, { cors: corsOptions });

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
                addActiveTeam(decoded.id, socket.id);
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
                addDualityUser(decoded.id, socket.id);
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

// ── Middleware ────────────────────────────────────────────────────────────────
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes — Extended Competition ─────────────────────────────────────────────
app.use('/api/admin', adminRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/teams', teamManagementRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/rounds', roundRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/settings', settingsRoutes);

// ── Routes — Duality Extended / Quiz ─────────────────────────────────────────
app.use('/api/duality/auth', dualityAuthRoutes);
app.use('/api/duality/allowed-emails', dualityAllowedEmailRoutes);
app.use('/api/duality/questions', dualityQuestionRoutes);
app.use('/api/duality/submissions', dualitySubmissionRoutes);
app.use('/api/duality/settings', dualitySettingsRoutes);
app.use('/api/duality/quiz', quizRoutes);
app.use('/api/duality/import', dualityImportRoutes);

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

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Initialize connections to both databases
        await connectDB();
        
        // Only connect to extended DB if URI is provided
        if (process.env.MONGODB_EXTENDED_URI) {
            await connectExtendedDB();
        } else {
            console.log('[API] MONGODB_EXTENDED_URI not found, skipping extended DB connection');
        }

        server.listen(PORT, () => {
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
