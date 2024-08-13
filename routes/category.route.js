const router = require("express").Router();
const {
  createCategory,
  getAllCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
} = require("../controllers/category.controllers");
const verifyToken = require("../middlewares/verifyToken");
const verifyAdmin = require("../middlewares/verifyAdmin");

// route category
router.post("/", verifyToken, verifyAdmin, createCategory);
router.get("/", getAllCategory);
router.put("/:categoryId", verifyToken, verifyAdmin, updateCategory);
router.delete("/:categoryId", verifyToken, verifyAdmin, deleteCategory);
router.get("/:categoryId", getCategoryById);

module.exports = router;
