const router = require("express").Router();
const {
  updateProfile,
  getProfile,
} = require("../controllers/profile.controllers");
const { upload } = require("../libs/multer");
const verifyToken = require("../middlewares/verifyToken");

// route profiles
router.put("/", upload.single("imageProfile"), verifyToken, updateProfile);
router.get("/", verifyToken, getProfile);

module.exports = router;
