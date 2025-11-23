const express = require("express");
const {
  createSignature,
  getSignature,
  deleteSignature,
} = require("../../controller/auth/signature.controller");
const { authenticateToken } = require("../../middleware/auth");

const router = express.Router();

router.post("/", authenticateToken, createSignature);
router.get("/", authenticateToken, getSignature);
router.delete("/", authenticateToken, deleteSignature);

module.exports = router;
