const router = require("express").Router();
const {
  createPromo,
  getAllPromo,
  updatePromo,
  deletePromo,
  getDetailPromo,
} = require("../controllers/promo.controllers");
const verifyToken = require("../middlewares/verifyToken");
const verifyAdmin = require("../middlewares/verifyAdmin");

// route promo
router.post("/", verifyToken, verifyAdmin, createPromo);
router.get("/", getAllPromo);
router.get("/:promoId", verifyToken, getDetailPromo);
router.put("/:promoId", verifyToken, verifyAdmin, updatePromo);
router.delete("/:promoId", verifyToken, verifyAdmin, deletePromo);

module.exports = router;
