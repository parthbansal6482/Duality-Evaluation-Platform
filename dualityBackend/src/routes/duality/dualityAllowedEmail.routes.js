const express = require('express');
const router = express.Router();
const { addEmail, addBulkEmails, removeEmail, getAllEmails } = require('../../controllers/duality/dualityAllowedEmail.controller');
const { protect, adminOnly } = require('../../middleware/dualityAuth');

router.use(protect, adminOnly);

router.post('/', addEmail);
router.post('/bulk', addBulkEmails);
router.delete('/:email', removeEmail);
router.get('/', getAllEmails);

module.exports = router;
