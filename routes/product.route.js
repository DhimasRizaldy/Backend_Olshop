const route = require("express").Router();
const { createProduct } = require("../controllers/product.controllers");
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

module.exports = route;
