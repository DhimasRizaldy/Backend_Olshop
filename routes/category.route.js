const router = require("express").Router();
const {
  createCategory,
  getAllCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controllers");
const verifyToken = require("../middlewares/verifyToken");
const verifyAdmin = require("../middlewares/verifyAdmin");

// route category
router.post("/", verifyToken, verifyAdmin, createCategory);
router.get("/", getAllCategory);
router.put("/:categoryId", verifyToken, verifyAdmin, updateCategory);
router.delete("/:categoryId", verifyToken, verifyAdmin, deleteCategory);

module.exports = router;
