const express = require("express");
const router = express.Router();
const ownerRequestController = require("../../../controller/user/ownerRequest.controller");
const { authenticateToken, authorizeRoles } = require("../../../middleware/auth");
const pagination = require("../../../middleware/pagination");


//User
router.post("/", authenticateToken, ownerRequestController.createOwnerRequest);
router.get("/my-requests", authenticateToken, ownerRequestController.getMyOwnerRequests);
router.get("/:id", authenticateToken, ownerRequestController.getOwnerRequestById);
router.put("/:id/cancel", authenticateToken, ownerRequestController.cancelOwnerRequest);

module.exports = router;