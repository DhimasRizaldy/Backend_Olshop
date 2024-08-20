const prisma = require("../libs/prisma");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  // create transaction
  checkout: async (req, res, next) => {
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
        const { productId, qty } = cart; // Pastikan menggunakan 'qty' bukan 'quantity'
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
                decrement: qty, // Pastikan menggunakan 'qty'
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
        for (const cart of carts) {
          await updateProductStock(cart);
        }
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

  // notification
  notification: async (req, res, next) => {
    try {
      const { transactionId, status_payment } = req.body;
      await prisma.transactions.update({
        where: {
          transactionId: transactionId,
        },
        data: {
          status_payment: status_payment,
        },
      });
      return res.status(200).json({
        success: true,
        message: "Notification received successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};
