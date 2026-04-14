const mongoose = require('mongoose');

let practiceConnection = null;

const connectPracticeDB = async () => {
    try {
        if (!process.env.MONGODB_PRACTICE_URI) {
            throw new Error('MONGODB_PRACTICE_URI is not set');
        }

        practiceConnection = mongoose.createConnection(process.env.MONGODB_PRACTICE_URI);
        await practiceConnection.asPromise();

        console.log(`Practice MongoDB Connected: ${practiceConnection.host}`);
        return practiceConnection;
    } catch (error) {
        console.error(`Practice DB Error: ${error.message}`);
        process.exit(1);
    }
};

const getPracticeConnection = () => {
    if (!practiceConnection) {
        throw new Error('Practice database not connected. Call connectPracticeDB() first.');
    }
    return practiceConnection;
};

module.exports = { connectPracticeDB, getPracticeConnection };
