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
  // create transaction
  checkout: async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { cartId, promoId, addressId, ongkirValue } = req.body;
      const { username, email, phoneNumber } = req.user;

      // Periksa apakah cartId ada dan valid
      if (!Array.isArray(cartId) || cartId.length === 0) {
        return res.status(400).json({
          status: false,
          message: "Invalid or missing cartId",
        });
      }

      const transactionId = uuidv4();

      // Mendapatkan data keranjang berdasarkan cartId
      const carts = await prisma.carts.findMany({
        where: {
          cartId: {
            in: cartId,
          },
        },
      });

      if (carts.length === 0) {
        return res.status(404).json({
          status: false,
          message: "No carts found",
        });
      }

      // Hitung total harga
      let total = carts.reduce((total, cart) => {
        return total + cart.price * cart.qty;
      }, 0);

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
      }

      total -= discount;
      total += ongkirValue;

      const transaction = await prisma.transactions.create({
        data: {
          transactionId,
          userId,
          cartId: cartId.join(","), // Menyimpan cartId sebagai string
          promoId,
          addressId,
          discount,
          ongkirValue,
          total,
          status_payment: "Pending",
          payment_type: null,
        },
      });

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
      console.error("Checkout error:", error); // Log error untuk debugging
      next(error);
    }
  },

  // notification payment
  notification: async (req, res, next) => {
    try {
      const {
        transactionId,
        transactions_status,
        payment_type,
        transaction_time,
      } = req.body;

      const transaction = await prisma.transactions.findUnique({
        where: {
          transactionId: transactionId,
        },
        include: {
          carts: true,
          users: true,
        },
      });

      if (transaction) {
        // Menentukan status pembayaran dan memperbarui transaksi
        let status_payment;
        switch (transactions_status) {
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
            break;
          default:
            return res.status(400).json({
              status: false,
              message: "Invalid transaction status",
            });
        }

        // Memperbarui transaksi di database
        await prisma.transactions.update({
          where: {
            transactionId: transactionId,
          },
          data: {
            payment_type: payment_type,
            status_payment: status_payment,
            transaction_time: transaction_time
              ? new Date(transaction_time)
              : undefined,
          },
        });

        return res.status(200).json({
          status: true,
          message: "Transaction updated successfully",
        });
      } else {
        return res.status(404).json({
          status: false,
          message: "Transaction not found",
        });
      }
    } catch (error) {
      next(error);
    }
  },
};
