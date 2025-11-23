const express = require("express");
const {
  getConditions,
} = require("../../controller/products/conditions.controller");

const router = express.Router();

router.get("/", getConditions);

module.exports = router;
