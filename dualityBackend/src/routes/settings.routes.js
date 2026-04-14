const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settings.controller');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getSettings); // Open to all or protected for students depending on how we fetch
router.put('/', protect, adminOnly, updateSettings);

module.exports = router;
