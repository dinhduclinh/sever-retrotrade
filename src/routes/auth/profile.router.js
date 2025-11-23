const express = require("express")
const router = express.Router()
const userController = require("../../controller/auth/auth.profile.controller")
const { authenticateToken } = require("../../middleware/auth")
const { uploadUserAvatar } = require("../../middleware/userAvatar.upload.middleware")
const { uploadUserAvatar: uploadAvatarController } = require("../../controller/auth/userAvatar.controller")

router.get('/', authenticateToken, userController.getProfile);
router.put('/', authenticateToken, userController.updateProfile);
router.put('/change-password', authenticateToken, userController.changePassword);

// Avatar upload - chỉ cần 1 API duy nhất
router.post('/avatar', 
    authenticateToken,
    uploadUserAvatar.single('avatar'),
    uploadAvatarController
);

module.exports = router;