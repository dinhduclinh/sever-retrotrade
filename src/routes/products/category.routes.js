const express = require("express");
const router = express.Router();

const {
  addCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  cascadeDeactivateCategory,
} = require("../../controller/products/category.controller");
const { authenticateToken } = require("../../middleware/auth");

router.get("/", getCategories); 
router.post("/", authenticateToken, addCategory); 
router.put("/:id", authenticateToken, updateCategory); 
router.delete("/:id", authenticateToken, deleteCategory); 
router.put(
  "/cascade-deactivate/:id",
  authenticateToken,
  cascadeDeactivateCategory
);
module.exports = router;
