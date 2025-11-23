const express = require("express");
const router = express.Router();
const notificationController = require("../../controller/notification.controller");
const notificationSSEController = require("../../controller/notification.sse.controller");
const { authenticateToken } = require("../../middleware/auth");
const pagination = require("../../middleware/pagination");

// All routes require authentication
router.get("/", authenticateToken, pagination(), notificationController.getNotifications);
// SSE endpoint cho notifications stream (phải đặt trước /:id để tránh conflict)
// Không dùng authenticateToken middleware vì EventSource không gửi custom headers
// Token được verify trực tiếp trong controller qua query param hoặc header
router.get("/stream", (req, res, next) => {
  // Nếu có Authorization header, dùng middleware authenticateToken
  if (req.headers.authorization) {
    return authenticateToken(req, res, () => {
      notificationSSEController.notificationStream(req, res, next);
    });
  }
  // Nếu không có header, kiểm tra token từ query param trong controller
  notificationSSEController.notificationStream(req, res, next);
});
// Get notification by ID (phải đặt sau /stream để tránh conflict)
router.get("/:id", authenticateToken, notificationController.getNotificationById);
router.put("/:id/read", authenticateToken, notificationController.markAsRead);
router.put("/read-all", authenticateToken, notificationController.markAllAsRead);
router.delete("/:id", authenticateToken, notificationController.deleteNotification);
router.delete("/read/all", authenticateToken, notificationController.deleteAllReadNotifications);

module.exports = router;

