const getDualityAllowedEmail = require('../../models/duality/DualityAllowedEmail');

/**
 * Add an email to the allowlist
 * POST /api/duality/allowed-emails
 */
exports.addEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        if (!email.toLowerCase().endsWith('@bmu.edu.in')) {
            return res.status(400).json({ success: false, message: 'Only @bmu.edu.in emails are allowed' });
        }

        const DualityAllowedEmail = getDualityAllowedEmail();
        const existing = await DualityAllowedEmail.findOne({ email: email.toLowerCase() });

        if (existing) {
            return res.status(400).json({ success: false, message: 'Email already in allowlist' });
        }

        const entry = await DualityAllowedEmail.create({
            email: email.toLowerCase(),
            addedBy: req.dualityUser._id,
        });

        res.status(201).json({ success: true, data: entry });
    } catch (error) {
        console.error('Add email error:', error);
        res.status(500).json({ success: false, message: 'Error adding email', error: error.message });
    }
};

/**
 * Add multiple emails to the allowlist
 * POST /api/duality/allowed-emails/bulk
 */
exports.addBulkEmails = async (req, res) => {
    try {
        const { emails } = req.body;

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ success: false, message: 'Emails array is required' });
        }

        const DualityAllowedEmail = getDualityAllowedEmail();
        const results = { added: [], skipped: [], errors: [] };

        for (const email of emails) {
            const normalizedEmail = email.toLowerCase().trim();

            if (!normalizedEmail.endsWith('@bmu.edu.in')) {
                results.errors.push({ email: normalizedEmail, reason: 'Not a @bmu.edu.in email' });
                continue;
            }

            const existing = await DualityAllowedEmail.findOne({ email: normalizedEmail });
            if (existing) {
                results.skipped.push(normalizedEmail);
                continue;
            }

            try {
                await DualityAllowedEmail.create({
                    email: normalizedEmail,
                    addedBy: req.dualityUser._id,
                });
                results.added.push(normalizedEmail);
            } catch (err) {
                results.errors.push({ email: normalizedEmail, reason: err.message });
            }
        }

        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error('Bulk add error:', error);
        res.status(500).json({ success: false, message: 'Error adding emails', error: error.message });
    }
};

/**
 * Remove an email from the allowlist
 * DELETE /api/duality/allowed-emails/:email
 */
exports.removeEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const DualityAllowedEmail = getDualityAllowedEmail();

        const result = await DualityAllowedEmail.findOneAndDelete({ email: email.toLowerCase() });

        if (!result) {
            return res.status(404).json({ success: false, message: 'Email not found in allowlist' });
        }

        res.status(200).json({ success: true, message: 'Email removed from allowlist' });
    } catch (error) {
        console.error('Remove email error:', error);
        res.status(500).json({ success: false, message: 'Error removing email', error: error.message });
    }
};

/**
 * Get all allowed emails
 * GET /api/duality/allowed-emails
 */
exports.getAllEmails = async (req, res) => {
    try {
        const DualityAllowedEmail = getDualityAllowedEmail();
        const emails = await DualityAllowedEmail.find().sort({ addedAt: -1 });

        res.status(200).json({ success: true, data: emails });
    } catch (error) {
        console.error('Get emails error:', error);
        res.status(500).json({ success: false, message: 'Error fetching emails', error: error.message });
    }
};
