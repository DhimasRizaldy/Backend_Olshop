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
      const { transactionId } = req.params; // Mendapatkan ID transaksi dari parameter request

      // Mendapatkan detail transaksi berdasarkan ID transaksi
      const transaction = await prisma.transactions.findUnique({
        where: {
          transactionId: transactionId,
        },
        include: {
          address: true, // Sertakan detail alamat pengiriman
          promo: true, // Sertakan detail promo jika ada
          carts: {
            include: {
              products: true, // Sertakan detail produk dalam keranjang
            },
          },
          users: true, // Sertakan detail pengguna
        },
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      // Opsional: Memastikan user yang meminta transaksi memiliki akses ke transaksi tersebut
      if (transaction.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Mengirimkan respons dengan detail transaksi
      return res.status(200).json({
        success: true,
        message: "Get transaction detail successfully",
        data: transaction,
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

      // Mendapatkan transaksi untuk memverifikasi apakah transaksi ini milik pengguna
      const transaction = await prisma.transactions.findUnique({
        where: { transactionId: transactionId },
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      if (transaction.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized to update this transaction",
        });
      }

      // Memperbarui transaksi dengan menggunakan fungsi update dari Prisma
      const updatedTransaction = await prisma.transactions.update({
        where: { transactionId: transactionId },
        data: {
          status_payment: status_payment,
          shippingStatus: shippingStatus,
          receiptDelivery: receiptDelivery,
        },
      });

      // Mengirimkan respons sukses bersama dengan data transaksi yang telah diperbarui
      return res.status(200).json({
        success: true,
        message: "Transaction updated successfully",
        data: updatedTransaction,
      });
    } catch (error) {
      // Menangani kesalahan jika terjadi
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
