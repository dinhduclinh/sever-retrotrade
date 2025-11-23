const User = require("../../models/User.model");
const { uploadUserAvatar, uploadToCloudinaryUserAvatar } = require("../../middleware/userAvatar.upload.middleware");
const { createNotification } = require("../../middleware/createNotification");

/**
 * Upload user avatar - xử lý cả file upload và URL update
 * Middleware authenticateToken đã được sử dụng trong router
 */
module.exports.uploadUserAvatar = async (req, res) => {
    try {
        // Kiểm tra req.user từ authenticateToken middleware
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                code: 401,
                message: "Token không hợp lệ hoặc đã hết hạn"
            });
        }

        const userId = req.user._id;
        const { avatarUrl } = req.body;

        // Verify user exists
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                code: 404,
                message: "Không tìm thấy người dùng"
            });
        }

        // User chỉ có thể update avatar của chính mình (đã được đảm bảo bởi authenticateToken)

        let finalAvatarUrl = null;

        // Nếu có file upload
        if (req.file) {
            // Upload to Cloudinary
            const uploadResult = await uploadToCloudinaryUserAvatar(req.file);

            if (!uploadResult.success) {
                return res.status(400).json({
                    code: 400,
                    message: uploadResult.message || "Lỗi khi upload ảnh"
                });
            }
            finalAvatarUrl = uploadResult.data.secure_url;
        }
        // Nếu có avatarUrl trong body (external URL)
        else if (avatarUrl) {
            finalAvatarUrl = avatarUrl;
        }
        // Nếu không có gì
        else {
            return res.status(400).json({
                code: 400,
                message: "Vui lòng upload file ảnh hoặc cung cấp avatarUrl"
            });
        }

        // Get current user data to check if avatar is changing
        const currentUser = await User.findById(userId);
        
        // Update user avatar in database
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                avatarUrl: finalAvatarUrl
            },
            { new: true }
        ).select("userGuid email fullName displayName avatarUrl bio phone isEmailConfirmed isPhoneConfirmed isIdVerified reputationScore points role wallet lastLoginAt createdAt updatedAt");

        // Create notification for avatar update (only if avatar actually changed)
        if (currentUser && currentUser.avatarUrl !== finalAvatarUrl) {
            try {
                await createNotification(
                    userId,
                    "Avatar Updated",
                    "Ảnh đại diện đã được cập nhật",
                    `Xin chào ${updatedUser.fullName || currentUser.fullName}, ảnh đại diện của bạn đã được cập nhật thành công vào lúc ${new Date().toLocaleString("vi-VN")}.`,
                    { 
                        updateTime: new Date().toISOString(),
                        newAvatarUrl: finalAvatarUrl
                    }
                );
            } catch (notificationError) {
                console.error("Error creating avatar update notification:", notificationError);
            }
        }

        return res.status(200).json({
            code: 200,
            message: "Cập nhật avatar thành công",
            data: {
                user: updatedUser,
                avatarUrl: finalAvatarUrl
            }
        });

    } catch (error) {
        console.error("Error uploading user avatar:", error);
        return res.status(500).json({
            code: 500,
            message: "Lỗi server khi upload avatar",
            error: error.message
        });
    }
};

// COMPLETED FUNCTIONS:
// 1. uploadUserAvatar - Upload user avatar (file upload + URL update)
