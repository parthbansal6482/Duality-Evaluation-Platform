const express = require('express');
const { getSettings, updateSettings } = require('../../controllers/duality/dualitySettings.controller');
const { protect, adminOnly } = require('../../middleware/dualityAuth');

const router = express.Router();

router.get('/', protect, getSettings);
router.put('/', protect, adminOnly, updateSettings);

module.exports = router;
