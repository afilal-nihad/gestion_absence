const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken, authorizeRoles('ADMIN', 'TRAINER'));

router.post('/bulk', attendanceController.bulkUpsertAttendance);
router.get('/', attendanceController.listAttendance);
router.get('/export', attendanceController.exportAttendanceCsv);

module.exports = router;

