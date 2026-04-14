const mongoose = require('mongoose');

let extendedConnection = null;

const connectExtendedDB = async () => {
    try {
        if (!process.env.MONGODB_EXTENDED_URI) {
            throw new Error('MONGODB_EXTENDED_URI is not set');
        }

        extendedConnection = mongoose.createConnection(process.env.MONGODB_EXTENDED_URI);
        await extendedConnection.asPromise();

        console.log(`Duality Extended MongoDB Connected: ${extendedConnection.host}`);
        return extendedConnection;
    } catch (error) {
        console.error(`Duality Extended DB Error: ${error.message}`);
        process.exit(1);
    }
};

const getExtendedConnection = () => {
    if (!extendedConnection) {
        throw new Error('Duality Extended database not connected. Call connectExtendedDB() first.');
    }
    return extendedConnection;
};

module.exports = { connectExtendedDB, getExtendedConnection };
