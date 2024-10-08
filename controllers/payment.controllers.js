const prisma = require("../libs/prisma");
const { v4: uuidv4 } = require("uuid");
const Midtrans = require("midtrans-client");

// Snap Midtrans
const snap = new Midtrans.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

module.exports = {
  // Function to send notification
  sendNotification: async (userId, transactionId, title, body, description) => {
    await prisma.notifications.create({
      data: {
        notificationId: uuidv4(),
        userId,
        transactionId,
        title,
        body,
        description,
        isRead: false,
        isDeleted: false,
      },
    });
  },

  // Function to handle checkout
  checkout: async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { cartIds, promoId, addressId, ongkirValue, courier } = req.body;
      const { username, email, phoneNumber } = req.user;

      // Validasi input
      if (!Array.isArray(cartIds) || cartIds.length === 0) {
        return res.status(400).json({
          status: false,
          message: "Invalid or missing cartIds",
        });
      }

      if (!addressId) {
        return res.status(400).json({
          status: false,
          message: "Invalid or missing addressId",
        });
      }

      if (!ongkirValue || typeof ongkirValue !== "number") {
        return res.status(400).json({
          status: false,
          message: "Invalid or missing ongkirValue",
        });
      }

      if (!courier) {
        return res.status(400).json({
          status: false,
          message: "Invalid or missing courier",
        });
      }

      const transactionId = uuidv4();

      const carts = await prisma.carts.findMany({
        where: {
          cartId: {
            in: cartIds,
          },
        },
        include: {
          products: true,
        },
      });

      if (carts.length === 0) {
        return res.status(404).json({
          status: false,
          message: "No carts found",
        });
      }

      let total = carts.reduce((total, cart) => {
        if (
          !cart.products ||
          (typeof cart.products.price !== "bigint" &&
            typeof cart.products.promoPrice !== "bigint") ||
          typeof cart.qty !== "number"
        ) {
          console.error("Invalid cart data:", cart);
          throw new Error(
            "Invalid cart data: Price or Quantity is not a number"
          );
        }
        const productPrice = cart.products.promoPrice || cart.products.price;
        return total + Number(productPrice) * cart.qty;
      }, 0);

      if (isNaN(total) || total <= 0) {
        console.error("Calculated total is invalid:", total);
        return res.status(400).json({
          status: false,
          message: "Total calculation error",
        });
      }

      let discount = 0;
      if (promoId) {
        const promo = await prisma.promo.findUnique({
          where: {
            promoId: promoId,
          },
        });

        if (!promo) {
          return res.status(400).json({
            status: false,
            message: "Promo not found",
          });
        }

        if (promo.expiresAt < new Date()) {
          return res.status(400).json({
            status: false,
            message: "Promo expired",
          });
        }

        discount = total * (promo.discount / 100);

        if (isNaN(discount)) {
          discount = 0;
        }
      }

      total -= discount;
      total += ongkirValue;

      if (isNaN(total) || total <= 0) {
        console.error("Final calculated total is invalid:", total);
        return res.status(400).json({
          status: false,
          message: "Total calculation error after discount and shipping",
        });
      }

      // Membuat transaksi dengan relasi address
      const transaction = await prisma.transactions.create({
        data: {
          transactionId,
          userId,
          cartIds,
          promoId: promoId || null, // Set promoId to null if not provided
          addressId,
          discount,
          ongkirValue,
          courier,
          total,
          status_payment: "Pending",
          payment_type: null,
        },
      });

      // Membuat transaksi di Midtrans
      const midtransTransaction = await snap.createTransaction({
        transaction_details: {
          order_id: transactionId,
          gross_amount: total,
        },
        customer_details: {
          first_name: username,
          email,
          phone: phoneNumber,
        },
      });

      // Simpan paymentUrl dan token ke dalam database
      await prisma.transactions.update({
        where: {
          transactionId: transaction.transactionId,
        },
        data: {
          paymentUrl: midtransTransaction.redirect_url,
          token: midtransTransaction.token,
        },
      });

      // Update stok produk di database setelah pembayaran berhasil
      await Promise.all(
        carts.map(async (cart) => {
          const product = cart.products;
          const newStock = product.stock - cart.qty;

          if (newStock < 0) {
            throw new Error(
              `Insufficient stock for product ${product.productId}`
            );
          }

          await prisma.products.update({
            where: {
              productId: product.productId,
            },
            data: {
              stock: newStock,
            },
          });
        })
      );

      // Update status isCheckout pada carts
      await prisma.carts.updateMany({
        where: {
          cartId: {
            in: cartIds,
          },
        },
        data: {
          isCheckout: true,
        },
      });

      return res.status(200).json({
        status: true,
        message: "Transaction created successfully",
        data: {
          ...transaction,
          paymentUrl: midtransTransaction.redirect_url,
          token: midtransTransaction.token,
        },
      });
    } catch (error) {
      console.error("Checkout error:", error);
      next(error);
    }
  },

  // Function to handle notification
  notification: async (req, res, next) => {
    try {
      const {
        transactionId, // Ubah nama parameter dari transaction_id ke transactionId
        transaction_status,
        payment_type,
      } = req.body;

      console.log("Notification received:", req.body);

      // Gunakan transactionId untuk menemukan transaksi di database
      const transaction = await prisma.transactions.findUnique({
        where: {
          transactionId: transactionId, // Gunakan transactionId untuk pencarian di database
        },
        include: {
          carts: true,
          users: true,
        },
      });

      if (transaction) {
        let status_payment;
        switch (transaction_status) {
          case "pending":
            status_payment = "Pending";
            break;
          case "settlement":
            status_payment = "Success";
            break;
          case "deny":
            status_payment = "Failed";
            break;
          case "expire":
            status_payment = "Expired";
            break;
          case "cancel":
            status_payment = "Cancelled";

            // Pembatalan transaksi di Midtrans
            try {
              const cancelResponse = await snap.transaction.cancel(
                transactionId
              );
              console.log("Transaction cancelled on Midtrans:", cancelResponse);
            } catch (cancelError) {
              console.error(
                "Error cancelling transaction on Midtrans:",
                cancelError
              );
              return res.status(500).json({
                status: false,
                message: "Failed to cancel transaction on Midtrans",
              });
            }
            break;
          default:
            console.error(
              "Invalid transaction status received:",
              transaction_status
            );
            return res.status(400).json({
              status: false,
              message: "Invalid transaction status",
            });
        }

        // Update status transaksi di database
        await prisma.transactions.update({
          where: {
            transactionId: transactionId, // Gunakan transactionId untuk pembaruan di database
          },
          data: {
            payment_type: payment_type,
            status_payment: status_payment,
            transaction_time: new Date(), // Waktu sekarang
          },
        });

        // Send notification if status_payment is "Success" and shippingStatus is "Pending"
        if (
          status_payment === "Success" &&
          transaction.shippingStatus === "Pending"
        ) {
          const notificationDescription = `Pesanan Berhasil dibayar. Pesanan anda akan diproses admin. silahkan cek detail pesanan anda.`;
          await module.exports.sendNotification(
            transaction.userId,
            transactionId,
            "Notification Payment",
            "Pesanan Berhasil dibayar",
            notificationDescription
          );
        }

        console.log("Transaction updated successfully:", {
          transactionId: transactionId,
          status_payment: status_payment,
        });

        return res.status(200).json({
          status: true,
          message: "Transaction updated successfully",
        });
      } else {
        console.error("Transaction not found for ID:", transactionId);
        return res.status(404).json({
          status: false,
          message: "Transaction not found",
        });
      }
    } catch (error) {
      console.error("Error handling notification:", error);
      next(error);
    }
  },
};
