const router = require("express").Router();
const {
  checkout,
  notification,
} = require("../controllers/payment.controllers");
const verifyToken = require("../middlewares/verifyToken");

// route payment
router.post("/checkout", verifyToken, checkout);
router.post("/notification", verifyToken, notification);

module.exports = router;
