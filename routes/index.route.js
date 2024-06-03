const router = require("express").Router();

// auth route
router.use("/auth", require("./auth.route"));
// category route
router.use("/category", require("./category.route"));
// supplier route
router.use("/supplier", require("./supplier.route"));
// promo route
router.use("/promo", require("./promo.route"));
// address route
router.use("/address", require("./address.route"));
// product route
router.use("/product", require("./product.route"));
// cart route
// router.use("/cart", require("./cart.route"));
// order route

module.exports = router;
