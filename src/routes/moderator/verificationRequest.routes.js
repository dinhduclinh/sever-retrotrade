const express = require("express");
const router = express.Router();
const verificationRequestController = require("../../controller/auth/verificationRequest.controller");
const { authenticateToken, authorizeRoles } = require("../../middleware/auth");

// Moderator routes
router.get("/", authenticateToken, authorizeRoles("moderator"), verificationRequestController.getAllVerificationRequests);
router.get("/:id", authenticateToken, authorizeRoles("moderator"), verificationRequestController.getVerificationRequestById);
router.post("/:id/assign", authenticateToken, authorizeRoles("moderator"), verificationRequestController.assignVerificationRequest);
router.post("/:id/handle", authenticateToken, authorizeRoles("moderator"), verificationRequestController.handleVerificationRequest);

module.exports = router;

