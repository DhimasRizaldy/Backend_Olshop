const router = require("express").Router();
const {
  createNotification,
  deleteMyNotifications,
  getAllNotifications,
  getMyNotifications,
  updateMyNotifications,
  getNotificationsById,
} = require("../controllers/notifications.controllers");
const verifyAdmin = require("../middlewares/verifyAdmin");
const verifyToken = require("../middlewares/verifyToken");
const crypto = require("crypto");
const prisma = require("../libs/prisma");
const { v4: uuidv4 } = require("uuid");

// Fungsi untuk memverifikasi signature key dari Midtrans
const verifySignature = (notification) => {
  const { order_id, status_code, gross_amount } = notification;
  const serverKey = process.env.MIDTRANS_SERVER_KEY; // Midtrans server key dari environment variable
  const input = `${order_id}${status_code}${gross_amount}${serverKey}`;
  const signature = crypto.createHash("sha512").update(input).digest("hex");
  return signature === notification.signature_key;
};

// Endpoint untuk menerima notifikasi Midtrans
router.post("/payment-notification", async (req, res) => {
  try {
    const notification = req.body;
    const {
      transaction_status,
      order_id,
      payment_type,
      transaction_time,
      gross_amount,
    } = notification;

    // Update transaksi berdasarkan order_id
    const transaction = await prisma.transactions.update({
      where: { token: order_id },
      data: {
        status_payment: transaction_status,
        payment_type: payment_type,
        transaction_time: new Date(transaction_time),
      },
    });

    // Simpan notifikasi terkait transaksi
    await prisma.notifications.create({
      data: {
        userId: transaction.userId,
        transactionId: transaction.transactionId, // Opsional jika Anda menambahkan relasi ini
        title: `Payment ${transaction_status}`,
        body: `Your payment of IDR ${gross_amount} is ${transaction_status}`,
        description: `Payment via ${payment_type} on ${transaction_time}`,
      },
    });

    res
      .status(200)
      .json({ message: "Notification received and processed successfully." });
  } catch (error) {
    console.error("Error handling Midtrans notification:", error);
    res.status(500).json({ message: "Failed to process notification." });
  }
});

// router notification existing routes
router.post("/", verifyToken, verifyAdmin, createNotification);
router.get("/", verifyToken, verifyAdmin, getAllNotifications);
router.get("/all", verifyToken, getMyNotifications);
router.get("/:notificationId", verifyToken, getNotificationsById);
router.put("/:notificationId", verifyToken, updateMyNotifications);
router.delete("/:notificationId", verifyToken, deleteMyNotifications);

module.exports = router;
