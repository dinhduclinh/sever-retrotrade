const Notification = require("../models/Notification.model");
const { sendUnreadCount } = require("../utils/sseManager");

/**
 * Get all notifications for current user with pagination
 */
module.exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { skip = 0, limit = 20 } = req.pagination || {};
    const { isRead } = req.query;

    let query = { user: userId };
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const [notifications, totalItems] = await Promise.all([
      Notification.find(query)
        .sort({ CreatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(query),
    ]);

    return res.json({
      code: 200,
      message: "Lấy danh sách thông báo thành công",
      data: {
        items: notifications,
        ...(res.paginationMeta ? res.paginationMeta(totalItems) : { totalItems }),
      },
    });
  } catch (error) {
    console.error("Error in getNotifications:", error);
    return res.json({
      code: 500,
      message: "Lấy danh sách thông báo thất bại",
      error: error.message,
    });
  }
};

/**
 * Get a single notification by ID
 */
module.exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: id,
      user: userId,
    });

    if (!notification) {
      return res.json({
        code: 404,
        message: "Không tìm thấy thông báo",
      });
    }

    return res.json({
      code: 200,
      message: "Lấy thông báo thành công",
      data: notification,
    });
  } catch (error) {
    console.error("Error in getNotificationById:", error);
    return res.json({
      code: 500,
      message: "Lấy thông báo thất bại",
      error: error.message,
    });
  }
};

/**
 * Mark a notification as read
 */
module.exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.json({
        code: 404,
        message: "Không tìm thấy thông báo",
      });
    }

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

    return res.json({
      code: 200,
      message: "Đánh dấu đã đọc thành công",
      data: notification,
    });
  } catch (error) {
    console.error("Error in markAsRead:", error);
    return res.json({
      code: 500,
      message: "Đánh dấu đã đọc thất bại",
      error: error.message,
    });
  }
};

/**
 * Mark all notifications as read for current user
 */
module.exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );

    // Cập nhật unread count qua SSE (sẽ là 0)
    try {
      sendUnreadCount(userId, 0);
    } catch (error) {
      console.error("Error sending unread count update:", error);
    }

    return res.json({
      code: 200,
      message: "Đánh dấu tất cả đã đọc thành công",
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    console.error("Error in markAllAsRead:", error);
    return res.json({
      code: 500,
      message: "Đánh dấu tất cả đã đọc thất bại",
      error: error.message,
    });
  }
};

/**
 * Delete a notification
 */
module.exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!notification) {
      return res.json({
        code: 404,
        message: "Không tìm thấy thông báo",
      });
    }

    return res.json({
      code: 200,
      message: "Xóa thông báo thành công",
      data: notification,
    });
  } catch (error) {
    console.error("Error in deleteNotification:", error);
    return res.json({
      code: 500,
      message: "Xóa thông báo thất bại",
      error: error.message,
    });
  }
};

/**
 * Delete all read notifications for current user
 */
module.exports.deleteAllReadNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.deleteMany({
      user: userId,
      isRead: true,
    });

    return res.json({
      code: 200,
      message: "Xóa tất cả thông báo đã đọc thành công",
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    console.error("Error in deleteAllReadNotifications:", error);
    return res.json({
      code: 500,
      message: "Xóa tất cả thông báo đã đọc thất bại",
      error: error.message,
    });
  }
};

