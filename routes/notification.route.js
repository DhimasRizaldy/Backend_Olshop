const router = require("express").Router();

const {
  createNotification,
  deleteMyNotifications,
  getAllNotifications,
  getMyNotifications,
  updateMyNotifications,
} = require("../controllers/notifications.controllers");
const verifyAdmin = require("../middlewares/verifyAdmin");
const verifyToken = require("../middlewares/verifyToken");

// router notification
router.post("/", verifyToken, verifyAdmin, createNotification);
router.get("/", verifyToken, verifyAdmin, getAllNotifications);
router.get("/all", verifyToken, getMyNotifications);
router.put("/:notificationId", verifyToken, updateMyNotifications);
router.delete("/:notificationId", verifyToken, deleteMyNotifications);

module.exports = router;
