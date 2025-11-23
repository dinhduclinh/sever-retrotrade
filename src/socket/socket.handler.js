const jwt = require('jsonwebtoken');
const Message = require('../models/Chat/Messages.model');
const Conversation = require('../models/Chat/Conversation.model');

const socketHandler = (io) => {
  // Track presence: userId -> connection count
  const userConnectionCount = new Map();

  // Authentication middleware for socket
  io.use((socket, next) => {
    // Support both auth.token and Authorization header
    const token = socket.handshake.auth.token || 
                  (socket.handshake.headers.authorization && socket.handshake.headers.authorization.split(' ')[1]);
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      // Use same secret as REST API middleware
      const secret = process.env.TOKEN_SECRET || process.env.JWT_SECRET;
      const decoded = jwt.verify(token, secret);
      // support tokens that carry either _id or userGuid
      socket.userId = decoded._id || decoded.userGuid;
      socket.user = decoded;
      next();
    } catch (err) {
      console.error('Socket auth error:', err.message);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId} (${socket.id})`);

    // User joins their own room
    socket.join(`user_${socket.userId}`);

    // Presence: increment and broadcast if first connection
    const uid = String(socket.userId);
    const prev = userConnectionCount.get(uid) || 0;
    userConnectionCount.set(uid, prev + 1);
    if (prev === 0) {
      io.emit('user_online', { userId: uid });
    }

    // Reply current online users on request
    socket.on('get_online_users', () => {
      const online = Array.from(userConnectionCount.entries())
        .filter(([_, count]) => count > 0)
        .map(([userId]) => userId);
      socket.emit('online_users', online);
    });

    // Listen for join conversation
    socket.on('join_conversation', async (conversationId) => {
      try {
        // Verify user is part of this conversation
        const conversation = await Conversation.findById(conversationId);
        
        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        if (
          !conversation.userId1.equals(socket.userId) &&
          !conversation.userId2.equals(socket.userId)
        ) {
          socket.emit('error', { message: 'Not authorized to join this conversation' });
          return;
        }

        // Join the conversation room
        socket.join(`conversation_${conversationId}`);
        console.log(`User ${socket.userId} joined conversation ${conversationId}`);

        // Notify others in the conversation
        socket.to(`conversation_${conversationId}`).emit('user_joined', {
          userId: socket.userId,
          conversationId
        });
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Error joining conversation' });
      }
    });

    // Listen for send message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content } = data;

        if (!conversationId || !content) {
          socket.emit('error', { message: 'Missing required fields' });
          return;
        }

        // Verify conversation exists
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        // Verify user is part of this conversation
        if (
          !conversation.userId1.equals(socket.userId) &&
          !conversation.userId2.equals(socket.userId)
        ) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        // Create message
        const message = await Message.create({
          conversationId,
          fromUserId: socket.userId,
          content
        });

        // Populate sender info
        const populatedMessage = await Message.findById(message._id)
          .populate('fromUserId', 'fullName email avatarUrl');

        // Emit to all clients in this conversation room only (avoids duplicates)
        io.to(`conversation_${conversationId}`).emit('new_message', populatedMessage);

        console.log(`Message sent in conversation ${conversationId} by user ${socket.userId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Error sending message', error: error.message });
      }
    });

    // Listen for typing indicators
    socket.on('typing', async (data) => {
      try {
        const { conversationId, isTyping } = data;
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) return;

        // Verify user is part of this conversation
        if (
          !conversation.userId1.equals(socket.userId) &&
          !conversation.userId2.equals(socket.userId)
        ) {
          return;
        }

        // Notify others in the conversation
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          userId: socket.userId,
          conversationId,
          isTyping
        });
      } catch (error) {
        console.error('Error handling typing:', error);
      }
    });

    // Listen for read receipt
    socket.on('mark_read', async (conversationId) => {
      try {
        // Verify user is part of this conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        if (
          !conversation.userId1.equals(socket.userId) &&
          !conversation.userId2.equals(socket.userId)
        ) {
          return;
        }

        const now = new Date();

        // Update lastReadBy for the current user
        const isUser1 = conversation.userId1.equals(socket.userId);
        if (isUser1) {
          conversation.lastReadBy = conversation.lastReadBy || {};
          conversation.lastReadBy.userId1 = now;
        } else {
          conversation.lastReadBy = conversation.lastReadBy || {};
          conversation.lastReadBy.userId2 = now;
        }
        await conversation.save();

        // Mark all messages in this conversation as read by current user
        await Message.updateMany(
          { 
            conversationId: conversationId,
            fromUserId: { $ne: socket.userId } // Only mark messages from other users
          },
          { 
            $addToSet: { readBy: socket.userId } // Add userId to readBy array if not exists
          }
        );

        // Notify others that user has read messages
        socket.to(`conversation_${conversationId}`).emit('messages_read', {
          userId: socket.userId,
          conversationId
        });
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId} (${socket.id})`);
      const uid = String(socket.userId);
      const prev = userConnectionCount.get(uid) || 0;
      const next = Math.max(0, prev - 1);
      userConnectionCount.set(uid, next);
      if (prev > 0 && next === 0) {
        io.emit('user_offline', { userId: uid });
      }
    });

    // Handle disconnect
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });
  });
};

module.exports = socketHandler;

