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

        let user = await User.findOne({ email: email.toLowerCase().trim() });
        
        if (user) {
            user.role = 'admin';
            await user.save();
            console.log(`\n✅ Successfully updated ${email} to ADMIN role in ${mode} database.`);
        } else {
            console.log(`\n❌ User ${email} does not exist in ${mode} database.`);
            if (mode === 'evaluation') {
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
