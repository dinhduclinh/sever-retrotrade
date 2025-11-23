const multer = require("multer");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

// Upload middleware for chat media (images and videos)
const uploadChatMedia = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Allow images: jpeg, jpg, png, gif, webp
    const imageTypes = /jpeg|jpg|png|gif|webp/;
    // Allow videos: mp4, webm, quicktime (mov)
    const videoTypes = /mp4|webm|quicktime/;
    
    const extname = imageTypes.test(file.originalname.toLowerCase()) || 
                   videoTypes.test(file.originalname.toLowerCase());
    const mimetype = file.mimetype.startsWith('image/') || 
                    file.mimetype.startsWith('video/');
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ hỗ trợ file ảnh (JPEG/JPG/PNG/GIF/WEBP) hoặc video (MP4/WEBM/MOV)"));
    }
  },
  limits: { 
    fileSize: 50 * 1024 * 1024 // 50MB max (for videos)
  },
});

// Upload single file to Cloudinary chat folder
const uploadToCloudinaryChat = async (file, mediaType = 'image') => {
  try {
    if (!file) {
      return {
        success: false,
        message: "Không có file để upload"
      };
    }

    const folder = "retrotrade/chat-media/";
    const resourceType = mediaType === 'video' ? 'video' : 'image';
    
    // For videos, add some compression/optimization
    const uploadOptions = {
      folder: folder,
      resource_type: resourceType,
      public_id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    if (resourceType === 'video') {
      uploadOptions.eager = [
        { width: 1280, height: 720, crop: "limit" }
      ];
      uploadOptions.quality = "auto";
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              success: true,
              data: {
                secure_url: result.secure_url,
                public_id: result.public_id,
                mediaType: resourceType,
                width: result.width,
                height: result.height,
                format: result.format,
                bytes: result.bytes
              }
            });
          }
        }
      );
      
      uploadStream.end(file.buffer);
    });
  } catch (error) {
    console.error("Error uploading chat media to Cloudinary:", error);
    return {
      success: false,
      message: "Lỗi khi upload lên Cloudinary: " + error.message
    };
  }
};

module.exports = { uploadChatMedia, uploadToCloudinaryChat };

