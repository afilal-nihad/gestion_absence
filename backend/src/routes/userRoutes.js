const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Route accessible à tout utilisateur connecté (retourne uniquement ses propres présences)
router.get('/me/attendance', authenticateToken, userController.getMyAttendance);
router.post('/me/attendance/:attendanceId/certificate', authenticateToken, authorizeRoles('TRAINEE'), userController.uploadMyCertificate);

router.use(authenticateToken);

router.get('/certificates', authorizeRoles('ADMIN'), userController.listCertificates);
router.put('/certificates/:id/status', authorizeRoles('ADMIN'), userController.reviewCertificate);
router.get('/trainees', authorizeRoles('ADMIN', 'TRAINER'), userController.listTrainees);
router.get('/trainees/:id/attendance', authorizeRoles('ADMIN', 'TRAINER'), userController.getTraineeAttendance);
router.post('/trainees', authorizeRoles('ADMIN'), userController.createTrainee);
router.put('/trainees/:id', authorizeRoles('ADMIN'), userController.updateTrainee);
router.delete('/trainees/:id', authorizeRoles('ADMIN'), userController.deleteTrainee);

// Validations de compte (ADMIN)
router.get('/pending', authorizeRoles('ADMIN'), userController.listPendingUsers);
router.put('/:id/status', authorizeRoles('ADMIN'), userController.updateUserStatus);

module.exports = router;
