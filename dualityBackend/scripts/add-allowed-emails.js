const { initDB } = require('./script-db');

// The emails you want to add - Edit this list!
const emailsToAdd = [
    'parth.bansal.24cse@bmu.edu.in'
];

async function addEmails() {
    try {
        const { mode, models } = await initDB();
        const AllowedEmail = models.AllowedEmail;

        if (!AllowedEmail) {
            console.error(`\n❌ Error: The [${mode}] platform does not use an Allowlist model.`);
            process.exit(1);
        }

        if (emailsToAdd.length === 0) {
            console.log('\nNo emails provided in the emailsToAdd array.');
            process.exit(0);
        }

        console.log(`\n=== Managing Allowlists for [${mode.toUpperCase()}] ===`);
        const results = { added: 0, skipped: 0, errors: 0 };

        for (const email of emailsToAdd) {
            const normalizedEmail = email.toLowerCase().trim();

            if (!normalizedEmail.endsWith('@bmu.edu.in')) {
                console.warn(`[SKIP] ${email} - Does not end with @bmu.edu.in`);
                results.errors++;
                continue;
            }

            try {
                const existing = await AllowedEmail.findOne({ email: normalizedEmail });
                if (existing) {
                    console.log(`[SKIP] ${normalizedEmail} - Already in allowlist`);
                    results.skipped++;
                } else {
                    await AllowedEmail.create({ email: normalizedEmail });
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
        console.error('\n❌ Initialization error:', error.message);
    } finally {
        process.exit(0);
    }
}

addEmails();
