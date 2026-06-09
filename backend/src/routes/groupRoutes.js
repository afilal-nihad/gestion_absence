const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/public', groupController.listPublicGroups);
router.use(authenticateToken);

router.get('/', authorizeRoles('ADMIN', 'TRAINER'), groupController.listGroups);
router.post('/', authorizeRoles('ADMIN'), groupController.createGroup);
router.put('/:id', authorizeRoles('ADMIN'), groupController.updateGroup);
router.delete('/:id', authorizeRoles('ADMIN'), groupController.deleteGroup);

module.exports = router;

