const ConversationModel = require("../../models/Chat/Conversation.model");
const MessagesModel = require("../../models/Chat/Messages.model");
const { uploadToCloudinaryChat } = require("../../middleware/chatMedia.upload.middleware");
const { emitNewMessage } = require("../../utils/emitMessage");

// Hàm gửi tin nhắn trong cuộc trò chuyện
const sendMessages = async (req, res) => {
  try {
    // Lấy conversationId và nội dung tin nhắn từ yêu cầu client
    const { conversationId, content } = req.body;

    // Kiểm tra xem có đủ dữ liệu không
    if (!conversationId || !content)
      return res.status(400).json({ message: 'Thiếu trường dữ liệu' });

    // Tìm cuộc trò chuyện theo ID
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation)
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });

    // Lấy userId trong token (người gửi)
    const userId = req.user._id;

    // Kiểm tra người gửi có tham gia cuộc trò chuyện không
    if (!(conversation.userId1.equals(userId) || conversation.userId2.equals(userId))) {
      return res.status(403).json({ message: 'Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này' });
    }

    // Tạo mới tin nhắn và lưu vào DB
    const message = await MessagesModel.create({
      conversationId,
      fromUserId: userId,
      content
    });

    // Populate sender info
    const populatedMessage = await MessagesModel.findById(message._id)
      .populate('fromUserId', 'fullName email avatarUrl');

    // Trả về tin nhắn vừa gửi
    res.status(201).json({
      code: 201,
      message: 'Gửi tin nhắn thành công',
      data: populatedMessage
    });
  } catch (err) {
    // Xử lý lỗi server
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// Hàm lấy danh sách tin nhắn trong cuộc trò chuyện
const getMessages = async (req, res) => {
  try {
    // Lấy ID cuộc trò chuyện từ tham số URL
    const conversationId = req.params.conversationId;

    // Tìm cuộc trò chuyện
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation)
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });

    // Lấy userId người dùng hiện tại
    const userId = req.user._id;

    // Kiểm tra user có thuộc cuộc trò chuyện không
    if (!(conversation.userId1.equals(userId) || conversation.userId2.equals(userId))) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập cuộc trò chuyện này' });
    }

    // Lấy 50 tin nhắn mới nhất, sắp xếp theo thời gian tạo giảm dần (mới nhất trước), sau đó reverse để hiển thị từ cũ đến mới
    const messages = await MessagesModel.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(25)
      .populate('fromUserId', 'fullName email avatarUrl');
    
    // Reverse để hiển thị từ cũ đến mới (tin cũ ở trên, tin mới ở dưới)
    messages.reverse();

    // Trả dữ liệu tin nhắn về client
    res.json({
      code: 200,
      message: 'Lấy tin nhắn thành công',
      data: messages
    });
  } catch (err) {
    // Xử lý lỗi server
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// Hàm lấy danh sách conversations của user
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Lấy tất cả conversations mà user tham gia
    const conversations = await ConversationModel.find({
      $or: [
        { userId1: userId },
        { userId2: userId }
      ]
    })
      .populate('userId1', 'fullName email avatarUrl role')
      .populate('userId2', 'fullName email avatarUrl role');

    // Lấy tin nhắn cuối cùng và tính unread count cho mỗi conversation
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await MessagesModel.findOne({ conversationId: conv._id })
          .sort({ createdAt: -1 })
          .populate('fromUserId', 'fullName avatarUrl');

        // Determine which user field represents current user
        const isUser1 = conv.userId1._id.equals(userId);
        const lastReadTimestamp = conv.lastReadBy 
          ? (isUser1 ? conv.lastReadBy.userId1 : conv.lastReadBy.userId2)
          : null;

        // Calculate unread count: messages from other user created after lastReadTimestamp
        let unreadCount = 0;
        if (lastReadTimestamp) {
          unreadCount = await MessagesModel.countDocuments({
            conversationId: conv._id,
            fromUserId: { $ne: userId }, // Messages from other user
            createdAt: { $gt: lastReadTimestamp }, // Created after last read
            isDeleted: { $ne: true } // Not deleted
          });
        } else {
          // If never read, count all messages from other user
          unreadCount = await MessagesModel.countDocuments({
            conversationId: conv._id,
            fromUserId: { $ne: userId },
            isDeleted: { $ne: true }
          });
        }

        return {
          ...conv.toObject(),
          lastMessage: lastMessage,
          unreadCount: unreadCount
        };
      })
    );

    // Sort by last message date (most recent first) or updatedAt if no message
    conversationsWithLastMessage.sort((a, b) => {
      const aDate = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.updatedAt).getTime();
      const bDate = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.updatedAt).getTime();
      return bDate - aDate;
    });

    res.json({
      code: 200,
      message: 'Lấy danh sách conversations thành công',
      data: conversationsWithLastMessage
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// Hàm tạo conversation
const createConversation = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.user._id;

    if (!targetUserId || targetUserId === userId) {
      return res.status(400).json({ message: 'User ID không hợp lệ' });
    }

    // Kiểm tra conversation đã tồn tại chưa
    let conversation = await ConversationModel.findOne({
      $or: [
        { userId1: userId, userId2: targetUserId },
        { userId1: targetUserId, userId2: userId }
      ]
    });

    if (conversation) {
      // Nếu đã có, trả về conversation đó
      await conversation.populate('userId1', 'fullName email avatarUrl role');
      await conversation.populate('userId2', 'fullName email avatarUrl role');
      return res.status(200).json({
        code: 200,
        message: 'Lấy cuộc trò chuyện thành công',
        data: conversation
      });
    }

    // Tạo conversation mới
    conversation = await ConversationModel.create({
      userId1: userId,
      userId2: targetUserId
    });

    await conversation.populate('userId1', 'fullName email avatarUrl role');
    await conversation.populate('userId2', 'fullName email avatarUrl role');

    res.status(201).json({
      code: 201,
      message: 'Tạo cuộc trò chuyện thành công',
      data: conversation
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// Hàm lấy thông tin conversation
const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await ConversationModel.findById(conversationId)
      .populate('userId1', 'fullName email avatarUrl role')
      .populate('userId2', 'fullName email avatarUrl role');

    if (!conversation) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    }

    // Kiểm tra user có tham gia conversation không
    if (
      !conversation.userId1._id.equals(userId) &&
      !conversation.userId2._id.equals(userId)
    ) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    res.json({
      code: 200,
      message: 'Lấy conversation thành công',
      data: conversation
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

const updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Nội dung không hợp lệ' });
    }

    const message = await MessagesModel.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Không tìm thấy tin nhắn' });

    // Only author can edit
    if (!message.fromUserId.equals(userId)) {
      return res.status(403).json({ message: 'Không có quyền sửa tin nhắn' });
    }

    // Update content
    message.content = content.trim();
    message.editedAt = new Date();
    await message.save();

    const populated = await MessagesModel.findById(message._id)
      .populate('fromUserId', 'fullName email avatarUrl');

    res.json({ code: 200, message: 'Cập nhật tin nhắn thành công', data: populated });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
}
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await MessagesModel.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Không tìm thấy tin nhắn' });

    // Only author can delete (soft)
    if (!message.fromUserId.equals(userId)) {
      return res.status(403).json({ message: 'Không có quyền xóa tin nhắn' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = '[Tin nhắn đã được xóa]';
    await message.save();

    res.json({ code: 200, message: 'Xóa tin nhắn thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
}

// Hàm gửi tin nhắn với media (image/video)
const sendMessageWithMedia = async (req, res) => {
  try {
    const { conversationId, content = "" } = req.body;
    const userId = req.user._id;

    if (!conversationId) {
      return res.status(400).json({ message: 'Thiếu conversationId' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Không có file media' });
    }

    // Verify conversation
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    }

    // Verify user is part of conversation
    if (!(conversation.userId1.equals(userId) || conversation.userId2.equals(userId))) {
      return res.status(403).json({ message: 'Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này' });
    }

    // Determine media type
    const isVideo = req.file.mimetype.startsWith('video/');
    const mediaType = isVideo ? 'video' : 'image';

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinaryChat(req.file, mediaType);
    
    if (!uploadResult.success) {
      return res.status(500).json({ message: 'Lỗi khi upload media', error: uploadResult.message });
    }

    // Create message with media
    const message = await MessagesModel.create({
      conversationId,
      fromUserId: userId,
      content: content || (mediaType === 'image' ? '📷 Hình ảnh' : '🎥 Video'),
      mediaType,
      mediaUrl: uploadResult.data.secure_url
    });

    // Populate sender info
    const populatedMessage = await MessagesModel.findById(message._id)
      .populate('fromUserId', 'fullName email avatarUrl');

    // Emit to socket for real-time update
    emitNewMessage(populatedMessage);

    res.status(201).json({
      code: 201,
      message: 'Gửi tin nhắn với media thành công',
      data: populatedMessage
    });
  } catch (err) {
    console.error('Error sending message with media:', err);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

// Mark conversation as read
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    }

    // Verify user is part of this conversation
    if (!conversation.userId1.equals(userId) && !conversation.userId2.equals(userId)) {
      return res.status(403).json({ message: 'Không có quyền truy cập cuộc trò chuyện này' });
    }

    const now = new Date();

    // Update lastReadBy for the current user
    const isUser1 = conversation.userId1.equals(userId);
    if (isUser1) {
      conversation.lastReadBy = conversation.lastReadBy || {};
      conversation.lastReadBy.userId1 = now;
    } else {
      conversation.lastReadBy = conversation.lastReadBy || {};
      conversation.lastReadBy.userId2 = now;
    }
    await conversation.save();

    // Mark all messages in this conversation as read by current user
    await MessagesModel.updateMany(
      { 
        conversationId: conversationId,
        fromUserId: { $ne: userId } // Only mark messages from other users
      },
      { 
        $addToSet: { readBy: userId } // Add userId to readBy array if not exists
      }
    );

    res.json({
      code: 200,
      message: 'Đánh dấu đã đọc thành công',
      data: conversation
    });
  } catch (err) {
    console.error('Error marking as read:', err);
    res.status(500).json({ message: 'Lỗi máy chủ', error: err.message });
  }
};

module.exports = {
  sendMessages,
  sendMessageWithMedia,
  getMessages,
  getConversations,
  createConversation,
  getConversation,
  updateMessage,
  deleteMessage,
  markAsRead
};
