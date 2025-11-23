const express = require("express");
const {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  previewTemplate,
  confirmCreateContract,
  getOrCreateContractForOrder,
  getContractById,
  signContract,
  decryptSignature,
  getContractSignatures,
  updateSignaturePosition,
  exportContractPDF,
} = require("../../controller/contract/contract.controller");
const { authenticateToken, authorizeRoles } = require("../../middleware/auth");
const { upload } = require("../../middleware/upload.middleware");

const router = express.Router();

const adminOnly = [authenticateToken, authorizeRoles("admin")];
const userOnly = [authenticateToken];

// Admin/Template Management
router.post("/templates", adminOnly, createTemplate);
router.get("/templates", authenticateToken, getTemplates);
router.get("/templates/:id", authenticateToken, getTemplateById);
router.put("/templates/:id", adminOnly, updateTemplate);
router.delete("/templates/:id", adminOnly, deleteTemplate);

// Preview and Confirm Create (User)
router.post("/preview", userOnly, previewTemplate);
router.post("/confirm-create", userOnly, confirmCreateContract);

// Contract Operations (User)
router.get("/order/:orderId", userOnly, getOrCreateContractForOrder);
router.get("/:contractId", userOnly, getContractById);
router.get("/:contractId/export-pdf", userOnly, exportContractPDF);
router.post(
  "/:contractId/sign",
  userOnly,
  upload.fields([{ name: "signatureData" }]),
  signContract
);
router.get("/:contractId/signatures", userOnly, getContractSignatures);
router.put(
  "/signatures/:contractSignatureId/position",
  userOnly,
  updateSignaturePosition
);

// Admin
router.get("/signatures/:signatureId/decrypt", adminOnly, decryptSignature);

module.exports = router;
