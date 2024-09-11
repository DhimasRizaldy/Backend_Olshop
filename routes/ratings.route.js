const router = require("express").Router();

const {
  createRatings,
  getAllRatings,
  getDetailRatings,
  updateRatings,
  deleteRatings,
} = require("../controllers/ratings.controllers");
const verifyToken = require("../middlewares/verifyToken");
const verifyAdmin = require("../middlewares/verifyAdmin");
const { upload } = require("../libs/multer");

// route ratings
router.post("/", verifyToken, upload.single("image"), createRatings);
router.get("/", getAllRatings);
router.get("/:ratingId", getDetailRatings);
router.put("/:ratingId", verifyToken, upload.single("image"), updateRatings);
router.delete("/:ratingId", verifyToken, verifyAdmin, deleteRatings);

module.exports = router;
