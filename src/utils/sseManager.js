/**
 * SSE Connection Manager
 * Quản lý các kết nối SSE theo userId để push notifications realtime
 */

// Map: userId -> Set of response objects
const sseConnections = new Map();

/**
 * Thêm kết nối SSE cho một user
 * @param {String} userId - User ID
 * @param {Object} res - Express response object
 */
const addConnection = (userId, res) => {
  const userIdStr = String(userId);
  
  if (!sseConnections.has(userIdStr)) {
    sseConnections.set(userIdStr, new Set());
  }
  
  sseConnections.get(userIdStr).add(res);
  console.log(`✅ SSE connected for user ${userIdStr}. Total connections: ${sseConnections.get(userIdStr).size}`);
  
  // Cleanup khi client disconnect
  res.on('close', () => {
    removeConnection(userIdStr, res);
  });
};

/**
 * Xóa kết nối SSE cho một user
 * @param {String} userId - User ID
 * @param {Object} res - Express response object
 */
const removeConnection = (userId, res) => {
  const userIdStr = String(userId);
  const connections = sseConnections.get(userIdStr);
  
  if (connections) {
    connections.delete(res);
    
    // Nếu không còn connection nào, xóa entry
    if (connections.size === 0) {
      sseConnections.delete(userIdStr);
      console.log(`🗑️  All SSE connections closed for user ${userIdStr}`);
    } else {
      console.log(`⚠️  SSE disconnected for user ${userIdStr}. Remaining: ${connections.size}`);
    }
  }
};

/**
 * Gửi notification qua SSE đến một user
 * @param {String} userId - User ID
 * @param {Object} notification - Notification object
 * @returns {Number} - Số lượng connections đã nhận notification
 */
const sendNotification = (userId, notification) => {
  const userIdStr = String(userId);
  const connections = sseConnections.get(userIdStr);
  
  if (!connections || connections.size === 0) {
    return 0;
  }
  
  let sentCount = 0;
  const data = JSON.stringify({
    type: 'notification',
    data: notification
  });
  
  // Gửi đến tất cả connections của user (có thể có nhiều tab/màn hình)
  connections.forEach((res) => {
    try {
      res.write(`data: ${data}\n\n`);
      sentCount++;
    } catch (error) {
      console.error(`Error sending SSE to user ${userIdStr}:`, error);
      // Xóa connection lỗi
      connections.delete(res);
    }
  });
  
  if (sentCount > 0) {
    console.log(`📨 SSE notification sent to user ${userIdStr} (${sentCount} connection(s))`);
  }
  
  return sentCount;
};

/**
 * Gửi unread count update qua SSE đến một user
 * @param {String} userId - User ID
 * @param {Number} unreadCount - Unread count
 * @returns {Number} - Số lượng connections đã nhận update
 */
const sendUnreadCount = (userId, unreadCount) => {
  const userIdStr = String(userId);
  const connections = sseConnections.get(userIdStr);
  
  if (!connections || connections.size === 0) {
    return 0;
  }
  
  let sentCount = 0;
  const data = JSON.stringify({
    type: 'unread_count',
    data: { unreadCount }
  });
  
  connections.forEach((res) => {
    try {
      res.write(`data: ${data}\n\n`);
      sentCount++;
    } catch (error) {
      console.error(`Error sending unread count SSE to user ${userIdStr}:`, error);
      connections.delete(res);
    }
  });
  
  return sentCount;
};

/**
 * Lấy số lượng connections hiện tại
 * @returns {Object} - Stats về connections
 */
const getStats = () => {
  let totalConnections = 0;
  let totalUsers = sseConnections.size;
  
  sseConnections.forEach((connections) => {
    totalConnections += connections.size;
  });
  
  return {
    totalUsers,
    totalConnections,
    connectionsPerUser: Array.from(sseConnections.entries()).map(([userId, connections]) => ({
      userId,
      count: connections.size
    }))
  };
};

/**
 * Đóng tất cả connections của một user
 * @param {String} userId - User ID
 */
const closeAllConnectionsForUser = (userId) => {
  const userIdStr = String(userId);
  const connections = sseConnections.get(userIdStr);
  
  if (connections) {
    connections.forEach((res) => {
      try {
        res.end();
      } catch (error) {
        console.error(`Error closing SSE connection for user ${userIdStr}:`, error);
      }
    });
    sseConnections.delete(userIdStr);
    console.log(`🔒 Closed all SSE connections for user ${userIdStr}`);
  }
};

module.exports = {
  addConnection,
  removeConnection,
  sendNotification,
  sendUnreadCount,
  getStats,
  closeAllConnectionsForUser
};

