const Admin = require('../models/Admin');
const { BOOTSTRAP_ADMINS } = require('../config/competitionBootstrapAdmins');

const ensureCompetitionBootstrapAdmins = async () => {
    if (!Array.isArray(BOOTSTRAP_ADMINS) || BOOTSTRAP_ADMINS.length === 0) {
        return;
    }

    for (const entry of BOOTSTRAP_ADMINS) {
        const name = String(entry?.name || '').trim();
        const email = String(entry?.email || '').toLowerCase().trim();
        const password = String(entry?.password || '');

        if (!name || !email || password.length < 6) {
            console.warn(`[BootstrapAdmin] Skipping invalid entry for email: ${email || '(missing email)'}`);
            continue;
        }

        const existing = await Admin.findOne({ email });
        if (existing) {
            continue;
        }

        await Admin.create({ name, email, password });
        console.log(`[BootstrapAdmin] Created competition admin: ${email}`);
    }
};

module.exports = {
    ensureCompetitionBootstrapAdmins,
};
