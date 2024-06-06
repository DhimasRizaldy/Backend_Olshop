const router = require("express").Router();
const {
  createSupplier,
  getAllSupplier,
  updateSupplier,
  deleteSupplier,
  getDetailSupplier,
} = require("../controllers/supplier.controllers");
const verifyToken = require("../middlewares/verifyToken");
const verifyAdmin = require("../middlewares/verifyAdmin");

// route supplier
router.post("/", verifyToken, verifyAdmin, createSupplier);
router.get("/", verifyToken, verifyAdmin, getAllSupplier);
router.put("/:supplierId", verifyToken, verifyAdmin, updateSupplier);
router.get("/:supplierId", verifyToken, getDetailSupplier);
router.delete("/:supplierId", verifyToken, verifyAdmin, deleteSupplier);

module.exports = router;
