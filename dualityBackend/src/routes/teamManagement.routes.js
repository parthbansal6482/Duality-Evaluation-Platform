const express = require('express');
const router = express.Router();
const {
    getAllTeams,
    approveTeam,
    rejectTeam,
    toggleDisqualification,
    approveAllPending,
} = require('../controllers/teamManagement.controller');
const { protect, adminOnly } = require('../middleware/auth');

// All routes are admin-only
router.use(protect, adminOnly);

router.get('/', getAllTeams);
router.put('/approve-all', approveAllPending);
router.put('/:teamId/approve', approveTeam);
router.put('/:teamId/reject', rejectTeam);
router.put('/:teamId/toggle-disqualification', toggleDisqualification);

module.exports = router;
