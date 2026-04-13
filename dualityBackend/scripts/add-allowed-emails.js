const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

// The emails you want to add - Edit this list!
const emailsToAdd = [
    'parth.bansal.24cse@bmu.edu.in'
];

async function addEmails() {
    if (!process.env.MONGODB_PRACTICE_URI) {
        console.error('Error: MONGODB_PRACTICE_URI not found in .env');
        process.exit(1);
    }

    if (emailsToAdd.length === 0) {
        console.log('No emails provided in the emailsToAdd array.');
        process.exit(0);
    }

    let connection;
    try {
        console.log('Connecting to EvalHub MongoDB...');
        connection = await mongoose.createConnection(process.env.MONGODB_PRACTICE_URI).asPromise();
        console.log('Connected successfully.');

        // Define schema for this script
        const allowedEmailSchema = new mongoose.Schema({
            email: {
                type: String,
                required: true,
                unique: true,
                lowercase: true,
                trim: true,
            },
            addedAt: {
                type: Date,
                default: Date.now,
            },
        });

        const DualityAllowedEmail = connection.model('DualityAllowedEmail', allowedEmailSchema);

        const results = { added: 0, skipped: 0, errors: 0 };

        for (const email of emailsToAdd) {
            const normalizedEmail = email.toLowerCase().trim();

            if (!normalizedEmail.endsWith('@bmu.edu.in')) {
                console.warn(`[SKIP] ${email} - Does not end with @bmu.edu.in`);
                results.errors++;
                continue;
            }

            try {
                const existing = await DualityAllowedEmail.findOne({ email: normalizedEmail });
                if (existing) {
                    console.log(`[SKIP] ${normalizedEmail} - Already in allowlist`);
                    results.skipped++;
                } else {
                    await DualityAllowedEmail.create({ email: normalizedEmail });
                    console.log(`[ADDED] ${normalizedEmail}`);
                    results.added++;
                }
            } catch (err) {
                console.error(`[ERROR] ${normalizedEmail}: ${err.message}`);
                results.errors++;
            }
        }

        console.log('\n--- Summary ---');
        console.log(`Added:   ${results.added}`);
        console.log(`Skipped: ${results.skipped}`);
        console.log(`Errors:  ${results.errors}`);
        console.log('---------------');

    } catch (error) {
        console.error('Connection error:', error.message);
    } finally {
        if (connection) {
            await connection.close();
            console.log('Database connection closed.');
        }
    }
}

addEmails();
