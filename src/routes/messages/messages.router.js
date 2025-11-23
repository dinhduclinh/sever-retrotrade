const express = require("express");
const { 
  sendMessages,
  sendMessageWithMedia, 
  getMessages, 
  getConversations,
  createConversation,
  getConversation,
  updateMessage,
  deleteMessage,
  markAsRead
} = require("../../controller/messages/messages.Controller");
const { authenticateToken } = require("../../middleware/auth");
const { uploadChatMedia } = require("../../middleware/chatMedia.upload.middleware");
const router = express.Router();
const { getStaff } = require("../../controller/messages/getStaff.controller");
// Staff routes
router.get("/staff", authenticateToken, getStaff);


// Conversation routes
router.get("/conversations", authenticateToken, getConversations);
router.post("/conversations", authenticateToken, createConversation);
router.get("/conversations/:conversationId", authenticateToken, getConversation);
router.put("/conversations/:conversationId/mark-read", authenticateToken, markAsRead);

// Message routes
router.post("/send", authenticateToken, sendMessages);
router.post("/send-media", authenticateToken, uploadChatMedia.single('media'), sendMessageWithMedia);
router.get("/:conversationId", authenticateToken, getMessages);
router.put("/message/:messageId", authenticateToken, updateMessage);
router.delete("/message/:messageId", authenticateToken, deleteMessage);

module.exports = router;