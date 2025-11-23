const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeRoles } = require("../../middleware/auth");
const DiscountController = require("../../controller/order/discount.controller");

// Admin management
router.get("/", authenticateToken, authorizeRoles("admin"), DiscountController.list);
router.get("/:code", authenticateToken, authorizeRoles("admin"), DiscountController.getByCode);
router.post("/", authenticateToken, authorizeRoles("admin"), DiscountController.create);
router.put("/:id", authenticateToken, authorizeRoles("admin"), DiscountController.update);
router.post("/:id/deactivate", authenticateToken, authorizeRoles("admin"), DiscountController.deactivate);
router.post("/:id/activate", authenticateToken, authorizeRoles("admin"), DiscountController.activate);
router.post("/:id/assign-users", authenticateToken, authorizeRoles("admin"), DiscountController.assignUsers);
router.post("/:id/set-public", authenticateToken, authorizeRoles("admin"), DiscountController.setPublic);

// User-facing (auth required, no admin)
router.get("/public/available", authenticateToken, DiscountController.listAvailable);
router.get("/public/by-code/:code", authenticateToken, DiscountController.getPublicByCode);
router.post("/validate", authenticateToken, DiscountController.publicValidate);
router.post("/claim", authenticateToken, DiscountController.claimDiscount);

module.exports = router;


