const router = require("express").Router();
const {
  createAddress,
  getAllAddress,
  updateAddress,
  deleteAddress,
  getDetailAddress,
} = require("../controllers/address.controllers");
const verifyToken = require("../middlewares/verifyToken");

// route address
router.post("/", verifyToken, createAddress);
router.get("/", verifyToken, getAllAddress);
router.get("/:addressId", verifyToken, getDetailAddress);
router.put("/:addressId", verifyToken, updateAddress);
router.delete("/:addressId", verifyToken, deleteAddress);

module.exports = router;
