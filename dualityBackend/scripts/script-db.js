const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

// We import the connection helpers and model factories
const { connectDB, getDBConnection } = require('../src/config/database');
const { connectExtendedDB, getExtendedConnection } = require('../src/config/extendedDatabase');

// Core Models
const Admin = require('../src/models/Admin');
const Question = require('../src/models/Question');
const Team = require('../src/models/Team');

// Duality / Evaluation Models
const getDualityUser = require('../src/models/duality/DualityUser');
const getDualityQuestion = require('../src/models/duality/DualityQuestion');
const getDualityAllowedEmail = require('../src/models/duality/DualityAllowedEmail');
const getDualitySettings = require('../src/models/duality/DualitySettings');

async function initDB() {
    let mode = '';
    
    if (process.argv.includes('--evaluation') || process.argv.includes('--eval')) {
        mode = 'evaluation';
    } else if (process.argv.includes('--competition') || process.argv.includes('--core')) {
        mode = 'competition';
    } else {
        // Interactive prompt fallback if needed, but for now we'll default to help message or evaluation
        console.log('No platform specified. Use --evaluation or --competition.');
        console.log('Defaulting to --evaluation for your current workflow...');
        mode = 'evaluation';
    }

    console.log(`\n🔹 Initializing for [${mode.toUpperCase()}] platform...`);

    if (mode === 'evaluation') {
        await connectExtendedDB();
        return {
            mode,
            connection: getExtendedConnection(),
            models: {
                User: getDualityUser(),
                Question: getDualityQuestion(),
                AllowedEmail: getDualityAllowedEmail(),
                Settings: getDualitySettings()
            }
        };
    } else {
        await connectDB();
        return {
            mode,
            connection: getDBConnection(),
            models: {
                User: Admin, // In core, admins are the main "users" for these scripts
                Question: Question,
                Team: Team
            }
        };
    }
}

module.exports = { initDB };
