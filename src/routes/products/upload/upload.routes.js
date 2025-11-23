const express = require("express");
const { uploadImages } = require("../../../controller/products/upload/upload.controller");
const { upload } = require("../../../middleware/upload.middleware"); 
const { authenticateToken } = require("../../../middleware/auth");

const router = express.Router();

router.post("/", upload.array("images", 10), authenticateToken, uploadImages);

module.exports = router;
