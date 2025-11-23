// Helper to emit messages via socket.io
// This will be set by server.js
let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

const emitNewMessage = (message) => {
  if (ioInstance && message) {
    const conversationId = message.conversationId?._id || message.conversationId;
    if (conversationId) {
      ioInstance.to(`conversation_${conversationId}`).emit('new_message', message);
    }
  }
};

module.exports = { setIO, emitNewMessage };

