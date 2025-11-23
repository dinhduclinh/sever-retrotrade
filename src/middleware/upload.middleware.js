const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const path = require("path");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ hỗ trợ file ảnh JPEG/JPG/PNG"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

const uploadToCloudinary = async (files, folder = "retrotrade/") => {
  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      
      // Upload from buffer instead of file path
      uploadStream.end(file.buffer);
    });
  });

  const results = await Promise.all(uploadPromises);

  return results.map((result, index) => ({
    Url: result.secure_url,
    IsPrimary: index === 0,
    Ordinal: index,
    AltText: files[index].originalname,
  }));
};

module.exports = { upload, uploadToCloudinary };
