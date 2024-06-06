const router = require("express").Router();
const {
  createCarts,
  getAllCarts,
  updateCarts,
  deleteCarts,
  getDetailCarts,
} = require("../controllers/carts.controllers");
const verifyToken = require("../middlewares/verifyToken");

// route carts
router.post("/", verifyToken, createCarts);
router.get("/", verifyToken, getAllCarts);
router.get("/:cartId", verifyToken, getDetailCarts);
router.put("/:cartId", verifyToken, updateCarts);
router.delete("/:cartId", verifyToken, deleteCarts);

module.exports = router;
