const express = require("express");
const {
  PostController,
  PostCategoryController,
  TagController,
  CommentController,
} = require("../../controller/blog/index");
const { authenticateToken, authorizeRoles } = require("../../middleware/auth");
const { upload } = require("../../middleware/upload.middleware");

const router = express.Router();

router.get("/posts", PostController.getAllPosts);
router.get("/posts/:id", PostController.getBlogDetail);
router.get("/posts/category/:categoryId", PostController.getPostsByCategory);
router.get("/posts/tag/:tagId", PostController.getPostsByTag);
router.get("/categories", PostCategoryController.getAllCategories);
router.get("/tags", TagController.getAllTags);
router.get("/comments", CommentController.getAllComment);
router.get("/comments/:id", CommentController.getCommentDetail);
router.get("/comment/:postId", CommentController.getCommentsByPost);

router.post("/posts", authenticateToken, authorizeRoles("moderator", "admin"), upload.array("images", 5), PostController.createPost);
router.put("/posts/:id", authenticateToken, authorizeRoles("moderator", "admin"), upload.array("images", 5), PostController.updatePost);
router.delete("/posts/:id", authenticateToken, authorizeRoles("moderator", "admin"), PostController.deletePost);

router.post("/categories", PostCategoryController.createCategory);
router.put("/categories/:id", PostCategoryController.updateCategory);
router.delete("/categories/:id", PostCategoryController.deleteCategory);

router.post("/tags", TagController.createTag);
router.put("/tags/:id", TagController.updateTag);
router.delete("/tags/:id", TagController.deleteTag);

router.post("/comments/:postId", authenticateToken, CommentController.addComment);
router.delete("/comments/:id", CommentController.deleteComment);
router.delete("/comments/user/:id",authenticateToken, CommentController.deleteCommentByUser);
router.put("/comments/:id", authenticateToken, CommentController.updateCommentByUser);
router.patch("/comments/ban/:id", CommentController.banComment);
module.exports = router; 
