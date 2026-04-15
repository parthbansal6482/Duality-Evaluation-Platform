const readline = require('readline');
const { initDB } = require('./script-db');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

async function run() {
    try {
        const { mode, models } = await initDB();
        
        console.log(`\n=== [${mode.toUpperCase()}] Admin Assignment Tool ===`);
        const email = await askQuestion("Enter the user's email address to promote: ");

        const User = models.User;
        const normalizedEmail = email.toLowerCase().trim();
        let user = await User.findOne({ email: normalizedEmail });
        
        if (user) {
            if (mode === 'competition') {
                // Competition uses the Admin model directly; existing user is already an admin account.
                console.log(`\n✅ Admin account already exists for ${email} in ${mode} database.`);
            } else {
                user.role = 'admin';
                await user.save();
                console.log(`\n✅ Successfully updated ${email} to ADMIN role in ${mode} database.`);
            }
        } else {
            if (mode === 'competition') {
                console.log(`\nℹ️ No admin account found for ${email} in competition database.`);
                const name = (await askQuestion('Enter admin name: ')).trim();
                const password = await askQuestion('Enter admin password (min 6 chars): ');

                if (!name) {
                    throw new Error('Admin name is required.');
                }
                if (!password || password.length < 6) {
                    throw new Error('Password must be at least 6 characters.');
                }

                await User.create({
                    name,
                    email: normalizedEmail,
                    password,
                });
                console.log(`\n✅ Successfully created COMPETITION admin: ${normalizedEmail}`);
            } else {
                console.log(`\n❌ User ${email} does not exist in ${mode} database.`);
                console.log(`Note: Users must first log in via Google before their account exists.`);
            }
        }
    } catch (e) {
        console.error("\n❌ Error occurred:", e.message);
    } finally {
        rl.close();
        process.exit(0);
    }
}

run();
