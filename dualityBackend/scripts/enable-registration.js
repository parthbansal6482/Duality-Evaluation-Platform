const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { connectExtendedDB } = require('../src/config/extendedDatabase');
const getDualitySettings = require('../src/models/duality/DualitySettings');

async function run() {
    try {
        console.log("=== EvalHub Registration Enabler ===");
        await connectExtendedDB();
        const DualitySettings = getDualitySettings();
        
        let settings = await DualitySettings.findOne();
        if (!settings) {
            settings = await DualitySettings.create({ isOpenRegistration: true, isPasteEnabled: true });
        } else {
            settings.isOpenRegistration = true;
            await settings.save();
        }
        
        console.log("Successfully ENABLED open registration for @bmu.edu.in accounts.");
        console.log("You should now be able to log in.");
    } catch (e) {
        console.error("Error occurred:", e);
    } finally {
        process.exit(0);
    }
}

run();
