const router = require("express").Router();

const {
  createManageStock,
  getAllManageStock,
  getManageStokById,
  updateManageStok,
  deleteManageStok,
} = require("../controllers/maganeStok.controllers");
const verifyToken = require("../middlewares/verifyToken");
const verifyAdmin = require("../middlewares/verifyAdmin");

// route managaeStok
router.post("/", verifyToken, verifyAdmin, createManageStock);
router.get("/", verifyToken, verifyAdmin, getAllManageStock);
router.get("/:manageStockId", getManageStokById);
router.put("/:manageStockId", verifyToken, verifyAdmin, updateManageStok);
router.delete("/:manageStockId", verifyToken, verifyAdmin, deleteManageStok);

module.exports = router;
