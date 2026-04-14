const { initDB } = require('./script-db');

const cleanup = async () => {
    try {
        const { mode, connection } = await initDB();

        console.log(`\n=== Cleaning Up [${mode.toUpperCase()}] Database ===`);

        const collectionsToDrop = mode === 'evaluation' 
            ? [
                'legacy_leaderboards',
                'legacy_problems',
                'legacy_submissions',
                'dualitysubmissions', // Clear submissions for a fresh eval start
                'dualityleaderboards'
              ]
            : [
                'legacy_leaderboards',
                'legacy_problems',
                'legacy_submissions',
                'studentprogresses',
                'students'
              ];

        const existingCollections = (await connection.db.listCollections().toArray()).map(c => c.name);
        console.log('Existing collections:', existingCollections);

        for (const colName of collectionsToDrop) {
            if (existingCollections.includes(colName)) {
                console.log(`Dropping collection: ${colName}...`);
                await connection.db.dropCollection(colName);
                console.log(`✅ Dropped ${colName}.`);
            } else {
                console.log(`- Collection ${colName} not found, skipping.`);
            }
        }

        console.log(`\n🎉 Cleanup complete for [${mode.toUpperCase()}]!`);
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Cleanup failed:', error.message);
        process.exit(1);
    }
};

cleanup();
