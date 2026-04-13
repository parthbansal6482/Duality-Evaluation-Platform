const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const cleanup = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error('MONGODB_URI not found in environment');
            process.exit(1);
        }

        console.log('Connecting to EvalHub Database...');
        const conn = await mongoose.createConnection(mongoUri).asPromise();
        console.log('Connected.');

        const collectionsToDrop = [
            'legacy_leaderboards',
            'legacy_problems',
            'legacy_submissions',
            'studentprogresses',
            'students'
        ];

        const existingCollections = (await conn.db.listCollections().toArray()).map(c => c.name);
        console.log('Existing collections:', existingCollections);

        for (const colName of collectionsToDrop) {
            if (existingCollections.includes(colName)) {
                console.log(`Dropping collection: ${colName}...`);
                await conn.db.dropCollection(colName);
                console.log(`Dropped ${colName}.`);
            } else {
                console.log(`Collection ${colName} not found, skipping.`);
            }
        }

        console.log('\nCleanup complete!');
        console.log('Collections remaining:', (await conn.db.listCollections().toArray()).map(c => c.name));

        await conn.close();
        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
};

cleanup();
