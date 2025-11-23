const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeRoles } = require("../../middleware/auth");
const serviceFeeController = require("../../controller/serviceFee/serviceFee.controller");

// Public route - Lấy cấu hình phí dịch vụ hiện tại
router.get("/current", serviceFeeController.getCurrentServiceFee);

// Admin routes - Quản lý cấu hình phí dịch vụ
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  serviceFeeController.getAllServiceFeeSettings
);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  serviceFeeController.createServiceFeeSetting
);

router.get(
  "/history/all",
  authenticateToken,
  authorizeRoles("admin"),
  serviceFeeController.getAllServiceFeeHistory
);

router.get(
  "/:id/history",
  authenticateToken,
  authorizeRoles("admin"),
  serviceFeeController.getServiceFeeHistory
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  serviceFeeController.updateServiceFeeSetting
);

router.delete(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  serviceFeeController.deleteServiceFeeSetting
);

router.post(
  "/:id/activate",
  authenticateToken,
  authorizeRoles("admin"),
  serviceFeeController.activateServiceFee
);

module.exports = router;

