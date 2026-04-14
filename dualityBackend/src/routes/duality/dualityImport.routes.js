const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadStudents } = require('../../controllers/duality/dualityAuth.controller');
const { protect, adminOnly } = require('../../middleware/dualityAuth');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
            file.mimetype === 'application/vnd.ms-excel' ||
            file.mimetype === 'text/csv') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel (.xlsx, .xls) or CSV files are allowed'), false);
        }
    }
});

/**
 * @route   POST /api/duality/import/students
 * @desc    Import students from Excel/CSV
 * @access  Private (Admin)
 */
router.post('/students', protect, adminOnly, upload.single('file'), uploadStudents);

module.exports = router;
