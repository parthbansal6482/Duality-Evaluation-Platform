const SUPER_ADMIN_EMAILS = new Set([
    'parth.bansal.24cse@bmu.edu.in',
]);

const ADMIN_EMAILS = new Set([
    // Add any additional Duality admin emails here.
    // Example: 'faculty.name@bmu.edu.in',
]);

const getDualityBootstrapRole = (email = '') => {
    const normalizedEmail = String(email).toLowerCase().trim();
    const isSuperAdmin = SUPER_ADMIN_EMAILS.has(normalizedEmail);
    const isAdmin = isSuperAdmin || ADMIN_EMAILS.has(normalizedEmail);

    return {
        isAdmin,
        isSuperAdmin,
    };
};

module.exports = {
    getDualityBootstrapRole,
};
