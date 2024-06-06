const router = require("express").Router();

const {} = require("../controllers/notifications.controllers");
const verifyAdmin = require("../middlewares/verifyAdmin");
const verifyToken = require("../middlewares/verifyToken");

// router notification

module.exports = router;
