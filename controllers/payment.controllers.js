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
      // Mengambil data dari body permintaan
      const { userId } = req.user;
      const { cartId, promoId, addressId, ongkirValue } = req.body;
      const { username, email, phoneNumber } = req.user;

      // Membuat ID untuk transaksi baru
      const transactionId = uuidv4();

      // Memperbarui stok produk sesuai dengan transaksi
      const updateProductStock = async (cart) => {
        const { productId, qty } = cart;
        const product = await prisma.products.findUnique({
          where: {
            productId: productId,
          },
        });

        const newStock = product.stock - qty;
        if (newStock < 0) {
          throw new Error("Insufficient stock");
        }

        await prisma.products.update({
          where: {
            productId: productId,
          },
          data: {
            stock: newStock,
          },
        });
      };

      const updateProductStocks = async (carts) => {
        for (const cart of carts) {
          await updateProductStock(cart);
        }
      };

      // Mendapatkan data keranjang berdasarkan cartId
      const carts = await prisma.carts.findMany({
        where: {
          cartId: {
            in: cartId,
          },
        },
      });

      await prisma.$transaction(async (prisma) => {
        await updateProductStocks(carts);
      });

      // Menghitung total harga
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

        if (promo.expiresAt > new Date()) {
          discount = total * (promo.discount / 100);
        }
      }

      total -= discount;
      total += ongkirValue; // Menambahkan ongkir ke total

      // Membuat transaksi di database
      const transaction = await prisma.transactions.create({
        data: {
          transactionId,
          userId,
          cartId: cartId.join(","), // Menyimpan cartId sebagai string jika banyak
          promoId,
          addressId,
          discount,
          ongkirValue, // Menyimpan nilai ongkir
          total,
          status_payment: "Pending",
          payment_type: null, // Menetapkan null sementara
        },
      });

      // Menghasilkan token dan URL pembayaran Midtrans
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
        // Anda dapat menambahkan lebih banyak konfigurasi di sini
      });

      return res.status(200).json({
        status: true,
        message: "Transaction created successfully",
        data: {
          ...transaction,
          paymentUrl: midtransTransaction.redirect_url, // URL pembayaran
          token: midtransTransaction.token, // Token pembayaran
        },
      });
    } catch (error) {
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
