require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createAdapter } = require('@socket.io/redis-adapter');
const connection = require('./config/redis');
const { connectPracticeDB } = require('./config/practiceDatabase');

// Debug log for recently added question


const {
    initializeSocket,
    addDualityUser,
    removeDualityUser,
} = require('./socket');

// Import routes

// Duality routes
const dualityAuthRoutes = require('./routes/duality/dualityAuth.routes');
const dualityAllowedEmailRoutes = require('./routes/duality/dualityAllowedEmail.routes');
const dualityQuestionRoutes = require('./routes/duality/dualityQuestion.routes');
const dualitySubmissionRoutes = require('./routes/duality/dualitySubmission.routes');
const dualitySettingsRoutes = require('./routes/duality/dualitySettings.routes');
const quizRoutes = require('./routes/duality/quiz.routes');

// Initialize express app
const app = express();
const server = http.createServer(app);

// CORS configuration
const allowedOrigins = [
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : []),
    process.env.CLIENT_URL,
    'http://localhost:3000',
    'http://localhost:5173'
].filter(Boolean); // Remove null/undefined

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
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
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Initialize Socket.IO with the same CORS options and Redis adapter
const io = new Server(server, {
    cors: corsOptions,
});

// Use Redis adapter for horizontal scaling
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

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        removeDualityUser(socket.id);
    });
});

app.options("*", cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes — Duality Practice
app.use('/api/duality/auth', dualityAuthRoutes);
app.use('/api/duality/allowed-emails', dualityAllowedEmailRoutes);
app.use('/api/duality/questions', dualityQuestionRoutes);
app.use('/api/duality/submissions', dualitySubmissionRoutes);
app.use('/api/duality/settings', dualitySettingsRoutes);
app.use('/api/duality/quiz', quizRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Start server only after database connections are ready
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectPracticeDB();

        server.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            console.log(`WebSocket server ready on port ${PORT}`);

            // Start background workers for code execution if configured
            if (process.env.START_WORKER === 'true' || process.env.NODE_ENV === 'development') {
                const dualitySubmissionQueue = require('./services/dualitySubmissionQueue');
                dualitySubmissionQueue.start();
                console.log('[API] Local background worker started');
            } else {
                console.log('[API] Running in API-only mode (Distributed Worker expected)');
            }
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();
