const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../../middleware/auth");
const {
  getActiveTerms,
  getTermsHistory,
  createTerms,
  updateTerms,
  deleteTerms,
} = require("../../controller/terms/terms.controller");

// Public
router.get("/active", getActiveTerms);

// Admin
router.get("/history", authenticateToken, getTermsHistory);
router.post("/", authenticateToken, createTerms);
router.put("/", authenticateToken, updateTerms);
router.delete("/:id", authenticateToken, deleteTerms);

module.exports = router;
