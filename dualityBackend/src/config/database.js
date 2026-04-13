const mongoose = require('mongoose');

let dbConnection = null;

/**
 * Initialize connection to MongoDB
 */
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not set');
        }

        dbConnection = mongoose.createConnection(process.env.MONGODB_URI);
        await dbConnection.asPromise();

        console.log(`Duality MongoDB Connected: ${dbConnection.host}`);
        return dbConnection;
    } catch (error) {
        console.error(`Database Connection Error: ${error.message}`);
        process.exit(1);
    }
};

/**
 * Get the active database connection
 */
const getDBConnection = () => {
    if (!dbConnection) {
        throw new Error('Database not connected. Call connectDB() first.');
    }
    return dbConnection;
};

module.exports = { connectDB, getDBConnection };
