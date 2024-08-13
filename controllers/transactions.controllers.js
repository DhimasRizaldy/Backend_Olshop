const prisma = require("../libs/prisma");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  // create transaction
  createTransaction: async (req, res, next) => {
    try {
      // Mengambil data dari body permintaan
      const {
        cartId,
        promoId,
        addressId,
        discount,
        total,
        payment_type,
        courier,
        receiptDelivery,
      } = req.body;

      // Membuat ID untuk transaksi baru
      const transactionId = uuidv4();

      const userId = req.user.userId;

      // Memperbarui stok produk sesuai dengan transaksi
      const updateProductStock = async (cart) => {
        const { productId, quantity } = cart;
        const product = await prisma.products.findUnique({
          where: {
            productId: productId,
          },
        });

        // Mengurangi stok produk berdasarkan jumlah yang dibeli dalam keranjang
        if (product) {
          await prisma.products.update({
            where: {
              productId: productId,
            },
            data: {
              stock: {
                decrement: quantity,
              },
            },
          });
        }
      };

      // Memperbarui stok produk untuk setiap item dalam keranjang
      const updateProductStocks = async () => {
        const carts = await prisma.carts.findMany({
          where: {
            cartId: cartId,
          },
        });
        carts.forEach(async (cart) => {
          await updateProductStock(cart);
        });
      };

      // Memperbarui stok produk dan membuat transaksi
      await prisma.$transaction(async (prisma) => {
        await updateProductStocks();
        await prisma.transactions.create({
          data: {
            transactionId: transactionId,
            userId: userId,
            cartId: cartId,
            promoId: promoId,
            addressId: addressId,
            discount: discount,
            total: total,
            payment_type: payment_type,
            courier: courier,
            receiptDelivery: receiptDelivery,
            status_payment: "Pending",
            shippingStatus: "Pending",
          },
        });
      });

      // Mengirimkan respons sukses
      return res.status(200).json({
        success: true,
        message: "Transaction created successfully",
        data: {
          transactionId: transactionId,
        },
      });
    } catch (error) {
      // Menangani kesalahan jika terjadi
      next(error);
    }
  },

  // get all transaction
  getAllTransaction: async (req, res, next) => {
    try {
      // Mendapatkan ID pengguna dari permintaan
      const userId = req.user.userId; // Asumsi req.user.userId berisi ID pengguna

      // Mengambil semua transaksi yang terkait dengan pengguna tersebut
      const transactions = await prisma.transactions.findMany({
        where: {
          userId: userId,
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
      // Mendapatkan ID transaksi dari permintaan
      const { transactionId } = req.params;

      // Mengambil detail transaksi berdasarkan ID transaksi
      const transaction = await prisma.transactions.findUnique({
        where: {
          transactionId: transactionId,
        },
        include: {
          address: true, // Sertakan detail alamat pengiriman
          promo: true, // Sertakan detail promo jika ada
          carts: {
            include: {
              products: true, // Sertakan detail produk dalam keranjang (corrected field name)
            },
          },
          users: true, // Sertakan detail pengguna
        },
      });

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
      // Mendapatkan ID transaksi dari permintaan
      const { transactionId } = req.params;

      // Mendapatkan data yang ingin diperbarui dari body permintaan
      const { status_payment, shippingStatus } = req.body;

      // Memperbarui transaksi dengan menggunakan fungsi update dari Prisma
      const updatedTransaction = await prisma.transactions.update({
        where: {
          transactionId: transactionId,
        },
        data: {
          status_payment: status_payment,
          shippingStatus: shippingStatus,
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
      next(error);
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
  getAllTransactionAdmin: async (req, res, next) => {
    try {
      const transactions = await prisma.transactions.findMany();
      return res.status(200).json({
        success: true,
        message: "Get all transactions successfully",
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  },
};
