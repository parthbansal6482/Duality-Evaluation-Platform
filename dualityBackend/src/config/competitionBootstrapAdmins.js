// NOTE:
// These accounts are auto-created in competition DB at server startup if missing.
// Keep this list minimal and rotate/remove credentials after regaining access.
const BOOTSTRAP_ADMINS = [
    {
        name: 'Competition Admin',
        email: 'admin@bmu.edu.in',
        password: 'Admin@123456',
    },
];

module.exports = {
    BOOTSTRAP_ADMINS,
};
