const express = require("express");
const router = express.Router();
const auditController = require("../../controller/audit/audit.controller");
const { authenticateToken, authorizeRoles } = require("../../middleware/auth");
const pagination = require("../../middleware/pagination");

// All routes require admin authentication
router.get(
    "/",
    authenticateToken,
    authorizeRoles("admin"),
    pagination(),
    auditController.getAllAuditLogs
);

router.get(
    "/:tableName/:primaryKeyValue",
    authenticateToken,
    authorizeRoles("admin"),
    auditController.getAuditLogsByEntity
);

module.exports = router;

