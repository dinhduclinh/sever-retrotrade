const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create upload directory for temporary files
const uploadDir = path.join(__dirname, "../../uploads/userAvatars");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Đã tạo thư mục upload avatar tại:", uploadDir);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and user ID
    const userId = req.params.id || 'unknown';
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `avatar_${userId}_${timestamp}${extension}`);
  },
});

// Configure multer
const uploadUserAvatar = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Only allow image files
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ hỗ trợ file ảnh JPEG/JPG/PNG/GIF/WEBP"));
    }
  },
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  },
});

/**
 * Upload single file to Cloudinary UserAvatar folder
 */
const uploadToCloudinaryUserAvatar = async (file) => {
  try {
    if (!file) {
      return {
        success: false,
        message: "Không có file để upload"
      };
    }

    // Upload to Cloudinary with specific folder
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "UserAvatar",
      resource_type: "image",
      transformation: [
        {
          width: 500,
          height: 500,
          crop: "fill",
          gravity: "face",
          quality: "auto",
          fetch_format: "auto"
        }
      ],
      public_id: `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    // Delete temporary file
    fs.unlink(file.path, (err) => {
      if (err) {
        console.error("Lỗi xóa file tạm:", file.path, err);
      }
    });

    return {
      success: true,
      data: {
        secure_url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      }
    };

  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    
    // Delete temporary file on error
    if (file && file.path) {
      fs.unlink(file.path, (err) => {
        if (err) console.error("Lỗi xóa file tạm sau lỗi:", file.path);
      });
    }

    return {
      success: false,
      message: "Lỗi khi upload lên Cloudinary: " + error.message
    };
  }
};

/**
 * Delete image from Cloudinary UserAvatar folder
 */
const deleteFromCloudinaryUserAvatar = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(`UserAvatar/${publicId}`);
    return {
      success: result.result === 'ok',
      data: result
    };
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    return {
      success: false,
      message: "Lỗi khi xóa từ Cloudinary: " + error.message
    };
  }
};

/**
 * Extract public ID from Cloudinary URL
 */
const extractPublicIdFromUrl = (url) => {
  try {
    if (!url || !url.includes('cloudinary.com')) {
      return null;
    }
    
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = filename.split('.')[0];
    
    return publicId;
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
};

module.exports = {
  uploadUserAvatar,
  uploadToCloudinaryUserAvatar,
  deleteFromCloudinaryUserAvatar,
  extractPublicIdFromUrl
};
