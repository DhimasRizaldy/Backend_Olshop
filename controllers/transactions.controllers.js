const prisma = require("../libs/prisma");
const { v4: uuidv4 } = require("uuid");
const { getPagination } = require("../libs/getPagination");

module.exports = {
  // get all transaction
  getAllTransactionMe: async (req, res, next) => {
    try {
      // Mendapatkan ID pengguna dari permintaan
      const userId = req.user.userId; // Asumsi req.user.userId berisi ID pengguna

      // Mengambil semua transaksi yang terkait dengan pengguna tersebut
      const transactions = await prisma.transactions.findMany({
        where: {
          userId: userId,
        },
        include: {
          users: {
            select: {
              username: true,
              email: true,
            },
          },
          carts: {
            include: {
              products: {
                select: {
                  name: true, // Sesuaikan jika Anda ingin menampilkan nama produk dari cart
                },
              },
            },
          },
          promo: {
            select: {
              codePromo: true,
            },
          },
          address: {
            select: {
              nameAddress: true, // Menggunakan field nameAddress sesuai schema
            },
          },
        },
      });

      // Mengirimkan respons dengan daftar transaksi
      return res.status(200).json({
        success: true,
        message: "Get all transactions successfully",
        data: transactions,
      });
    } catch (error) {
      // Menangani kesalahan jika terjadi
      next(error);
    }
  },

  // get detail transaction
  getDetailTransaction: async (req, res, next) => {
    try {
      const userId = req.user.userId; // Mengambil ID pengguna dari request (misalnya dari middleware autentikasi)
      const userRole = req.user.role; // Mengambil role pengguna dari request (misalnya dari middleware autentikasi)
      const { transactionId } = req.params; // Mendapatkan ID transaksi dari parameter request

      // Mendapatkan detail transaksi berdasarkan ID transaksi
      const transaction = await prisma.transactions.findUnique({
        where: {
          transactionId: transactionId,
        },
        include: {
          address: true, // Sertakan detail alamat pengiriman
          promo: true, // Sertakan detail promo jika ada
          users: {
            select: {
              userId: true, // Ambil userId
              username: true, // Ambil nama pengguna
              email: true, // Ambil email pengguna
              profiles: {
                select: {
                  phoneNumber: true, // Ambil nomor telepon dari profil
                },
              },
            },
          },
        },
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      // Memastikan user yang meminta transaksi memiliki akses ke transaksi tersebut
      if (transaction.userId !== userId && userRole !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Ambil detail carts berdasarkan cartIds yang ada di transaksi
      const carts = await prisma.carts.findMany({
        where: {
          cartId: { in: transaction.cartIds }, // Filter berdasarkan cartIds yang ada di transaksi
        },
        include: {
          products: true, // Sertakan detail produk
        },
      });

      // Memetakan produk dalam cart untuk mendapatkan nama, harga, kuantitas, dan gambar produk
      const cartDetails = carts.map((cart) => {
        return {
          productName: cart.products.name, // Nama produk
          productPrice: cart.products.price.toString(), // Harga produk (konversi BigInt ke string)
          productQuantity: cart.qty, // Kuantitas produk yang dibeli (qty dari Carts model)
          productImage: cart.products.image, // Gambar produk
          totalPricePerProduct: (
            BigInt(cart.products.price) * BigInt(cart.qty)
          ).toString(), // Total harga per produk (konversi BigInt ke string)
        };
      });

      // Mengirimkan respons dengan detail transaksi lengkap dan produk dalam cart
      return res.status(200).json({
        success: true,
        message: "Get transaction detail successfully",
        data: {
          transactionId: transaction.transactionId,
          userId: transaction.users.userId,
          discount: transaction.discount.toString(), // Konversi BigInt ke string
          ongkirValue: transaction.ongkirValue.toString(), // Konversi BigInt ke string
          total: transaction.total.toString(), // Konversi BigInt ke string
          status_payment: transaction.status_payment,
          payment_type: transaction.payment_type,
          transaction_time: transaction.transaction_time,
          courier: transaction.courier,
          receiptDelivery: transaction.receiptDelivery,
          shippingStatus: transaction.shippingStatus,
          paymentUrl: transaction.paymentUrl,
          token: transaction.token,
          address: transaction.address,
          promo: transaction.promo,
          user: {
            userId: transaction.users.userId,
            username: transaction.users.username,
            email: transaction.users.email,
            phoneNumber: transaction.users.profiles.phoneNumber, // Nomor telepon dari profil pengguna
          },
          cartDetails, // Detail produk dalam cart
        },
      });
    } catch (error) {
      // Menangani kesalahan jika terjadi
      console.error("Error fetching transaction details:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to get transaction details",
        error: error.message,
      });
    }
  },

  // update transaction
  updateTransaction: async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { transactionId } = req.params;

      // Memverifikasi bahwa transactionId disediakan
      if (!transactionId) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID is required",
        });
      }

      // Mendapatkan data yang ingin diperbarui dari body permintaan
      const { status_payment, shippingStatus, receiptDelivery } = req.body;

      // Memverifikasi bahwa data yang diterima valid
      if (!status_payment || !shippingStatus || !receiptDelivery) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      // Mendapatkan informasi pengguna dan perannya
      const user = await prisma.users.findUnique({
        where: { userId: userId },
        select: { role: true },
      });

      // Mendapatkan transaksi untuk memverifikasi apakah transaksi ini ada
      const transaction = await prisma.transactions.findUnique({
        where: { transactionId: transactionId },
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      // Validasi akses berdasarkan role
      if (user.role === "ADMIN" || user.role === "USER") {
        // Jika role adalah ADMIN atau USER yang memiliki transaksi tersebut, izinkan update
        const updatedTransaction = await prisma.transactions.update({
          where: { transactionId: transactionId },
          data: {
            status_payment: status_payment,
            shippingStatus: shippingStatus,
            receiptDelivery: receiptDelivery,
          },
        });

        return res.status(200).json({
          success: true,
          message: "Transaction updated successfully",
          data: updatedTransaction,
        });
      } else {
        // Jika bukan ADMIN atau pemilik transaksi, berikan unauthorized response
        return res.status(403).json({
          success: false,
          message:
            "Unauthorized: Admin role or owner of the transaction required",
        });
      }
    } catch (error) {
      console.error("Error updating transaction:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to update transaction",
        error: error.message,
      });
    }
  },

  // delete transaction
  deleteTransaction: async (req, res, next) => {
    try {
      // Mendapatkan ID transaksi dari permintaan
      const { transactionId } = req.params;

      // Menghapus transaksi dari basis data menggunakan Prisma
      const deletedTransaction = await prisma.transactions.delete({
        where: {
          transactionId: transactionId,
        },
      });

      // Mengirimkan respons sukses bersama dengan data transaksi yang telah dihapus
      return res.status(200).json({
        success: true,
        message: "Transaction deleted successfully",
        data: deletedTransaction,
      });
    } catch (error) {
      // Menangani kesalahan jika terjadi
      next(error);
    }
  },

  // get all transactional only admin
  getAllTransaction: async (req, res, next) => {
    try {
      // Mengambil semua transaksi dengan relasi terkait
      const transactions = await prisma.transactions.findMany({
        include: {
          users: {
            select: {
              username: true,
              email: true,
            },
          },
          carts: {
            include: {
              products: {
                select: {
                  name: true, // Menyertakan nama produk
                },
              },
            },
          },
          promo: {
            select: {
              codePromo: true,
            },
          },
          address: {
            select: {
              nameAddress: true, // Menggunakan field nameAddress sesuai skema
            },
          },
        },
      });

      // Mengirimkan respons dengan daftar transaksi
      return res.status(200).json({
        success: true,
        message: "Get all transactions successfully",
        data: transactions,
      });
    } catch (error) {
      // Menangani kesalahan jika terjadi
      next(error);
    }
  },
};
