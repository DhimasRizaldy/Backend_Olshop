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
// profile route
router.use("/profile", require("./profile.route"));
// cart route
router.use("/carts", require("./carts.route"));
// notification route
router.use("/notification", require("./notification.route"));
// manageStok route
router.use("/manageStok", require("./manageStok.route"));
// transaction route
router.use("/transaction", require("./transactions.route"));
// ratings route
router.use("/ratings", require("./ratings.route"));

module.exports = router;
