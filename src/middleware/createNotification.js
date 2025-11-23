const Notification = require("../models/Notification.model");
const User = require("../models/User.model");
const { sendNotification, sendUnreadCount } = require("../utils/sseManager");

/**
 * Utility function to create notifications easily
 * Can be imported and used in any controller
 * 
 * @param {String} userId - User ID to send notification to
 * @param {String} notificationType - Type of notification (e.g., "Login Success", "Order Placed")
 * @param {String} title - Notification title
 * @param {String} body - Notification body/content
 * @param {Object} metadata - Optional metadata object (will be stringified)
 * @returns {Promise<Notification|null>} Created notification or null on error
 * 
 * @example
 * const { createNotification } = require("../middleware/createNotification");
 * await createNotification(
 *   userId,
 *   "Order Placed",
 *   "Đơn hàng mới",
 *   "Bạn có một đơn hàng mới #12345",
 *   { orderId: "12345", total: 100000 }
 * );
 */
const createNotification = async (userId, notificationType, title, body, metadata = null) => {
  try {
    const notification = await Notification.create({
      user: userId,
      notificationType: notificationType,
      title: title,
      body: body,
      metaData: metadata ? JSON.stringify(metadata) : null,
      isRead: false,
    });

    // Push notification qua SSE realtime
    const notificationData = {
      _id: notification._id,
      user: String(userId),
      notificationType: notification.notificationType,
      title: notification.title,
      body: notification.body,
      metaData: notification.metaData,
      isRead: notification.isRead,
      CreatedAt: notification.CreatedAt
    };
    
    sendNotification(userId, notificationData);
    
    // Cập nhật unread count qua SSE
    try {
      const unreadCount = await Notification.countDocuments({
        user: userId,
        isRead: false
      });
      sendUnreadCount(userId, unreadCount);
    } catch (error) {
      console.error("Error sending unread count update:", error);
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

/**
 * Broadcast notification to all users
 * 
 * @param {String} notificationType - Type of notification (e.g., "System Update", "New Feature")
 * @param {String} title - Notification title
 * @param {String} body - Notification body/content
 * @param {Object} metadata - Optional metadata object (will be stringified)
 * @returns {Promise<{success: number, failed: number}>} Count of successful and failed notifications
 * 
 * @example
 * const { broadcastNotification } = require("../middleware/createNotification");
 * await broadcastNotification(
 *   "System Update",
 *   "Cập nhật hệ thống mới",
 *   "Hệ thống đã được cập nhật với nhiều tính năng mới. Vui lòng cập nhật ứng dụng.",
 *   { version: "2.0.0", features: ["dark mode", "new design"] }
 * );
 */
const broadcastNotification = async (notificationType, title, body, metadata = null) => {
  try {
    // Get all active users
    const users = await User.find({ 
      isActive: true, 
      isDeleted: { $ne: true } 
    }).select('_id');
    
    if (!users || users.length === 0) {
      console.log("No users found to send notifications");
      return { success: 0, failed: 0 };
    }

    // Prepare notification data
    const notificationData = {
      notificationType,
      title,
      body,
      metaData: metadata ? JSON.stringify(metadata) : null,
      isRead: false,
    };

    // Create notifications for all users using bulk insert for better performance
    const notificationsToInsert = users.map(user => ({
      ...notificationData,
      user: user._id,
    }));

    // Use insertMany for better performance
    const result = await Notification.insertMany(notificationsToInsert, { ordered: false });
    
    return {
      success: result.length,
      failed: users.length - result.length,
      total: users.length
    };
  } catch (error) {
    console.error("Error broadcasting notifications:", error);
    return {
      success: 0,
      failed: 0,
      error: error.message
    };
  }
};

module.exports = { createNotification, broadcastNotification };

