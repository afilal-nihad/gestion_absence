const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken, authorizeRoles('ADMIN'));

router.get('/global', statsController.getGlobalStats);
router.get('/global/export', statsController.exportGlobalStatsCsv);
router.get('/global/export-pdf', statsController.exportGlobalStatsPdf);

module.exports = router;
