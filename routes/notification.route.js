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
const prisma = require("../prismaClient"); // Sesuaikan dengan path prisma Anda
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

    // Verifikasi signature key
    if (!verifySignature(notification)) {
      return res.status(403).json({ message: "Invalid signature" });
    }

    // Dapatkan status transaksi dari notifikasi
    const { transaction_status, order_id, transaction_time, payment_type } =
      notification;

    // Update status transaksi di database
    if (transaction_status === "settlement") {
      // Update transaksi sebagai "paid"
      await prisma.transaction.update({
        where: { orderId: order_id },
        data: {
          status: "paid",
          paymentType: payment_type,
          transactionTime: new Date(transaction_time),
        },
      });
    } else if (transaction_status === "expire") {
      // Update transaksi sebagai "expired"
      await prisma.transaction.update({
        where: { orderId: order_id },
        data: { status: "expired" },
      });
    }

    // Kirim notifikasi ke semua pengguna terkait transaksi (opsional)
    const users = await prisma.users.findMany();
    const notifications = users.map((user) => ({
      notificationId: uuidv4(),
      userId: user.userId,
      title: "Payment Notification",
      body: `Your payment status for order ${order_id} is ${transaction_status}`,
      isRead: false,
    }));

    await prisma.notifications.createMany({
      data: notifications,
    });

    // Respon HTTP 200 ke Midtrans
    return res.status(200).json({ message: "Notification received" });
  } catch (error) {
    console.error("Error handling Midtrans notification:", error);
    return res.status(500).json({ message: "Server error" });
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
