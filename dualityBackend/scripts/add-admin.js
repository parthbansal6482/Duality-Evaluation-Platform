const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Admin = require('../src/models/Admin');
const { connectDB } = require('../src/config/database');
const getDualityUser = require('../src/models/duality/DualityUser');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

async function run() {
    try {
        console.log("=== EvalHub Admin Assignment Tool ===");
        const email = await askQuestion("Enter the user's email address: ");

        await connectDB();
        const DualityUser = getDualityUser();

        let user = await DualityUser.findOne({ email });
        if (user) {
            user.role = 'admin';
            await user.save();
            console.log(`Successfully updated ${email} to admin role in EvalHub platform.`);
        } else {
            console.log(`User ${email} does not exist in EvalHub platform.`);
            console.log(`Users must first log in via Google before their role can be upgraded.`);
        }
    } catch (e) {
        console.error("Error occurred:", e);
    } finally {
        rl.close();
        process.exit(0);
    }
}

run();
