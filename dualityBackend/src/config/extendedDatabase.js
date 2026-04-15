const mongoose = require('mongoose');
const { getDualityMongoUri } = require('./dbUris');

let extendedConnection = null;

const connectExtendedDB = async () => {
    try {
        const dualityUri = getDualityMongoUri();
        if (!dualityUri) {
            throw new Error('MONGODB_DUALITY_URI (or MONGODB_EXTENDED_URI) is not set');
        }

        extendedConnection = mongoose.createConnection(dualityUri);
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
