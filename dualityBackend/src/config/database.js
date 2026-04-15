const mongoose = require('mongoose');
const { getCompetitionMongoUri } = require('./dbUris');

/**
 * Initialize connection to MongoDB
 * Competition models (Team, Round, etc.) use the default mongoose connection provided by mongoose.connect()
 * Duality models use the specific connection instance via getDBConnection()
 */
const connectDB = async () => {
    try {
        const mongoUri = getCompetitionMongoUri();
        if (!mongoUri) {
            throw new Error('MONGODB_COMPETITION_URI (or MONGODB_URI) is not set');
        }

        // mongoose.connect sets the global/default connection used by mongoose.model()
        const conn = await mongoose.connect(mongoUri);

        console.log(`Competition/Core MongoDB Connected: ${conn.connection.host}`);
        return conn.connection;
    } catch (error) {
        console.error(`Database Connection Error: ${error.message}`);
        process.exit(1);
    }
};

/**
 * Get the active database connection
 * Returns the default connection which Duality models expect
 */
const getDBConnection = () => {
    if (!mongoose.connection || mongoose.connection.readyState === 0) {
        throw new Error('Database not connected. Call connectDB() first.');
    }
    return mongoose.connection;
};

module.exports = { connectDB, getDBConnection };
