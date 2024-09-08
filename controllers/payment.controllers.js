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
  // checkout: async (req, res, next) => {
  //   try {
  //     const { userId } = req.user;
  //     const { cartIds, promoId, addressId, ongkirValue, courier } = req.body; // Menggunakan cartIds
  //     const { username, email, phoneNumber } = req.user;

  //     // Periksa apakah cartIds ada dan valid
  //     if (!Array.isArray(cartIds) || cartIds.length === 0) {
  //       return res.status(400).json({
  //         status: false,
  //         message: "Invalid or missing cartIds",
  //       });
  //     }

  //     const transactionId = uuidv4();

  //     // Mendapatkan data keranjang berdasarkan cartIds
  //     const carts = await prisma.carts.findMany({
  //       where: {
  //         cartId: {
  //           in: cartIds,
  //         },
  //       },
  //       include: {
  //         products: true, // Memuat data produk terkait
  //       },
  //     });

  //     if (carts.length === 0) {
  //       return res.status(404).json({
  //         status: false,
  //         message: "No carts found",
  //       });
  //     }

  //     // Debug: Log data carts untuk memastikan harga dan qty valid
  //     console.log("Carts Data:", carts);

  //     // Hitung total harga
  //     let total = carts.reduce((total, cart) => {
  //       // Memastikan bahwa 'products' dan 'price' ada, dan 'qty' adalah angka
  //       if (
  //         !cart.products ||
  //         typeof cart.products.price !== "number" ||
  //         typeof cart.qty !== "number"
  //       ) {
  //         console.error("Invalid cart data:", cart); // Debug log jika ada item yang invalid
  //         throw new Error(
  //           "Invalid cart data: Price or Quantity is not a number"
  //         );
  //       }
  //       return total + cart.products.price * cart.qty;
  //     }, 0);

  //     // Debug: Log total setelah kalkulasi awal
  //     console.log("Initial Total:", total);

  //     // Validasi total
  //     if (isNaN(total) || total <= 0) {
  //       console.error("Calculated total is invalid:", total); // Log jika total tidak valid
  //       return res.status(400).json({
  //         status: false,
  //         message: "Total calculation error",
  //       });
  //     }

  //     let discount = 0;
  //     if (promoId) {
  //       const promo = await prisma.promo.findUnique({
  //         where: {
  //           promoId: promoId,
  //         },
  //       });

  //       if (!promo) {
  //         return res.status(400).json({
  //           status: false,
  //           message: "Promo not found",
  //         });
  //       }

  //       if (promo.expiresAt < new Date()) {
  //         return res.status(400).json({
  //           status: false,
  //           message: "Promo expired",
  //         });
  //       }

  //       discount = total * (promo.discount / 100);

  //       // Debug: Log nilai discount
  //       console.log("Calculated Discount:", discount);

  //       // Validasi discount
  //       if (isNaN(discount)) {
  //         discount = 0; // Atur discount ke 0 jika terjadi error
  //       }
  //     }

  //     total -= discount;
  //     total += ongkirValue;

  //     // Debug: Log total setelah diskon dan ongkir
  //     console.log("Total after discount and shipping:", total);

  //     // Validasi total setelah perhitungan diskon dan ongkir
  //     if (isNaN(total) || total <= 0) {
  //       console.error("Final calculated total is invalid:", total); // Log jika total akhir tidak valid
  //       return res.status(400).json({
  //         status: false,
  //         message: "Total calculation error after discount and shipping",
  //       });
  //     }

  //     // Membuat transaksi dengan relasi address
  //     const transaction = await prisma.transactions.create({
  //       data: {
  //         transactionId,
  //         userId,
  //         cartIds, // Menggunakan cartIds sebagai array
  //         promoId,
  //         addressId,
  //         discount,
  //         ongkirValue,
  //         courier, // Menyimpan nama kurir
  //         total,
  //         status_payment: "Pending",
  //         payment_type: null,
  //       },
  //     });

  //     // Membuat transaksi di Midtrans
  //     const midtransTransaction = await snap.createTransaction({
  //       transaction_details: {
  //         order_id: transactionId,
  //         gross_amount: total,
  //       },
  //       customer_details: {
  //         first_name: username,
  //         email,
  //         phone: phoneNumber,
  //       },
  //     });

  //     // Simpan paymentUrl dan token ke dalam database
  //     await prisma.transactions.update({
  //       where: {
  //         transactionId: transaction.transactionId,
  //       },
  //       data: {
  //         paymentUrl: midtransTransaction.redirect_url,
  //         token: midtransTransaction.token,
  //       },
  //     });

  //     // Update status isCheckout pada carts
  //     await prisma.carts.updateMany({
  //       where: {
  //         cartId: {
  //           in: cartIds,
  //         },
  //       },
  //       data: {
  //         isCheckout: true,
  //       },
  //     });

  //     return res.status(200).json({
  //       status: true,
  //       message: "Transaction created successfully",
  //       data: {
  //         ...transaction,
  //         paymentUrl: midtransTransaction.redirect_url,
  //         token: midtransTransaction.token,
  //       },
  //     });
  //   } catch (error) {
  //     console.error("Checkout error:", error); // Log error untuk debugging
  //     next(error);
  //   }
  // },

  checkout: async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { cartIds, promoId, addressId, ongkirValue, courier } = req.body;
      const { username, email, phoneNumber } = req.user;

      if (!Array.isArray(cartIds) || cartIds.length === 0) {
        return res.status(400).json({
          status: false,
          message: "Invalid or missing cartIds",
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
          typeof cart.products.price !== "number" ||
          typeof cart.qty !== "number"
        ) {
          console.error("Invalid cart data:", cart);
          throw new Error(
            "Invalid cart data: Price or Quantity is not a number"
          );
        }
        return total + cart.products.price * cart.qty;
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
          promoId,
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

  // notification payment
  notification: async (req, res, next) => {
    try {
      const {
        transaction_id, // pastikan ini sesuai dengan nama dari Midtrans
        transaction_status,
        payment_type,
      } = req.body;

      console.log("Notification received:", req.body);

      const transaction = await prisma.transactions.findUnique({
        where: {
          transactionId: transaction_id, // pastikan ini sesuai dengan nama dari database
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
                transaction_id
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
            transactionId: transaction_id,
          },
          data: {
            payment_type: payment_type,
            status_payment: status_payment,
            transaction_time: new Date(), // Waktu sekarang
          },
        });

        console.log("Transaction updated successfully:", {
          transactionId: transaction_id,
          status_payment: status_payment,
        });

        return res.status(200).json({
          status: true,
          message: "Transaction updated successfully",
        });
      } else {
        console.error("Transaction not found for ID:", transaction_id);
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
