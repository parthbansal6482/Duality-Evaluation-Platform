const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../../src/config/database');

function normalizeConstraints(constraints) {
    if (Array.isArray(constraints)) return constraints.map((c) => String(c).trim()).filter(Boolean);
    if (typeof constraints === 'string') {
        return constraints.split('\n').map((c) => c.trim()).filter(Boolean);
    }
    return [];
}

async function run() {
    try {
        await connectDB();
        const collection = mongoose.connection.db.collection('questions');
        const docs = await collection.find({}).toArray();

        let updated = 0;
        for (const doc of docs) {
            const legacyHidden = Array.isArray(doc.hiddenTestCases) ? doc.hiddenTestCases : [];
            const existingCases = Array.isArray(doc.testCases) ? doc.testCases : [];

            // If testCases is legacy number, ignore it and derive from hidden array.
            const normalizedTestCases =
                existingCases.length > 0
                    ? existingCases
                    : legacyHidden.map((tc) => ({
                        input: tc.input,
                        output: tc.output,
                    }));

            const normalizedBoilerplate = doc.boilerplate || doc.boilerplateCode || {};
            const normalizedConstraints = normalizeConstraints(doc.constraints);

            await collection.updateOne(
                { _id: doc._id },
                {
                    $set: {
                        constraints: normalizedConstraints,
                        testCases: normalizedTestCases,
                        boilerplate: normalizedBoilerplate,
                    },
                    $unset: {
                        hiddenTestCases: '',
                        boilerplateCode: '',
                    },
                }
            );
            updated++;
        }

        console.log(`\n✅ Migration complete. Updated ${updated} question document(s).`);
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exitCode = 1;
    } finally {
        try {
            await mongoose.disconnect();
        } catch (_) {}
    }
}

run();
