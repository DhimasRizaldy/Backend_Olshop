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

// route ratings
router.post("/", verifyToken, createRatings);
router.get("/", getAllRatings);
router.get("/:ratingsId", getDetailRatings);
router.put("/:ratingsId", verifyToken, updateRatings);
router.delete("/:ratingsId", verifyToken, deleteRatings);

module.exports = router;
