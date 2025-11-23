const express = require('express');
const router = express.Router();
const treeController = require('../../controller/games/tree.controller');
const { authenticateToken } = require('../../middleware/auth');

router.get('/state', authenticateToken, treeController.state);
router.post('/water', authenticateToken, treeController.water);
router.post('/fertilize', authenticateToken, treeController.fertilize);
router.post('/reset', authenticateToken, treeController.reset);
router.patch('/background', authenticateToken, treeController.updateBackground);

module.exports = router;


