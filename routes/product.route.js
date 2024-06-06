const route = require("express").Router();
const {
  createProduct,
  getAllProduct,
  getDetailProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controllers");
const verifyAdmin = require("../middlewares/verifyAdmin");
const verifyToken = require("../middlewares/verifyToken");
const { upload } = require("../libs/multer");

// route product
route.post(
  "/",
  verifyToken,
  verifyAdmin,
  upload.single("image"),
  createProduct
);
route.get("/", getAllProduct);
route.get("/:productId", getDetailProduct);
route.put(
  "/:productId",
  verifyToken,
  verifyAdmin,
  upload.single("image"),
  updateProduct
);
route.delete("/:productId", verifyToken, verifyAdmin, deleteProduct);

module.exports = route;
