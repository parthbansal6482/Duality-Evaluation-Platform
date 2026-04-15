const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB, getDBConnection } = require('../src/config/database');
const { connectExtendedDB, getExtendedConnection } = require('../src/config/extendedDatabase');
const { assertMongoSeparation } = require('../src/config/dbUris');
const { getBoundaryReport } = require('../src/config/dbBoundaries');

async function run() {
    try {
        assertMongoSeparation();

        await connectDB();
        await connectExtendedDB();

        const competitionConn = getDBConnection();
        const dualityConn = getExtendedConnection();

        const report = await getBoundaryReport(competitionConn, dualityConn);

        console.log('\n=== DB Boundary Audit ===');
        console.log(`Competition DB: ${competitionConn.name}`);
        console.log(`Duality DB: ${dualityConn.name}`);

        if (report.clean) {
            console.log('\n✅ No boundary violations found. Databases are cleanly separated.');
        } else {
            console.log('\n❌ Boundary violations found.');
            if (report.misplacedInCompetition.length) {
                console.log(`- In competition DB but should be duality: ${report.misplacedInCompetition.join(', ')}`);
            }
            if (report.misplacedInDuality.length) {
                console.log(`- In duality DB but should be competition: ${report.misplacedInDuality.join(', ')}`);
            }
        }

        const strict = process.argv.includes('--strict');
        if (strict && !report.clean) {
            process.exitCode = 1;
        }
    } catch (error) {
        console.error('\n❌ Audit failed:', error.message);
        process.exitCode = 1;
    } finally {
        try {
            const extConn = getExtendedConnection();
            if (extConn && extConn.readyState === 1) {
                await extConn.close();
            }
        } catch (_) {}

        try {
            if (mongoose.connection.readyState === 1) {
                await mongoose.disconnect();
            }
        } catch (_) {}
    }
}

run();
