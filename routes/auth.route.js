const router = require("express").Router();
const {
  loginUsers,
  registerUsers,
  registerAdmin,
  authenticate,
  getAllUsers,
  updateAdmin,
  deleteAdmin,
  getUsersById,
  resendOTP,
  verifyOTP,
  resetPassword,
  forgotPassword,
  changePassword,
  loginGoogle,
} = require("../controllers/auth.controllers");
const verifyToken = require("../middlewares/verifyToken");
const verifyAdmin = require("../middlewares/verifyAdmin");

router.get("/", (req, res) => {
  res.send("Hello World! this is development branch");
});

router.post("/login", loginUsers);
router.post("/register", registerUsers);
router.post("/verifyOTP", verifyOTP);
router.post("/register-admin", verifyToken, verifyAdmin, registerAdmin);
router.get("/whoami", verifyToken, authenticate);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.put("/change-password", verifyToken, changePassword);

// Google OAuth
router.post("/google", loginGoogle);

// router users
router.get("/users", verifyToken, verifyAdmin, getAllUsers);
router.put("/users/:userId", verifyToken, verifyAdmin, updateAdmin);
router.delete("/users/:userId", verifyToken, verifyAdmin, deleteAdmin);
router.get("/users/:userId", verifyToken, verifyAdmin, getUsersById);

module.exports = router;
