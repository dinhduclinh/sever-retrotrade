const express = require("express");
const {
  getPriceUnits,
} = require("../../controller/products/priceUnits.controller");

const router = express.Router();

router.get("/", getPriceUnits);

module.exports = router;
