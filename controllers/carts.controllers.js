const prisma = require("../libs/prisma");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  // create carts
  createCarts: async (req, res, next) => {
    try {
      let { qty } = req.body;
      if (!qty || !Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid quantity",
        });
      }

      const cartId = uuidv4();
      const userId = req.user?.userId;
      const productId = req.product?.productId;

      if (!userId || !productId) {
        return res.status(400).json({
          success: false,
          message: "User ID or Product ID is missing",
        });
      }

      let newCarts = await prisma.carts.create({
        data: {
          cartId: cartId,
          productId: productId,
          qty: qty,
          users: {
            connect: { userId: userId },
          },
          products: {
            connect: { productId: productId },
          },
        },
      });

      res.status(200).json({
        success: true,
        message: "Successfully created cart",
        data: newCarts,
      });
    } catch (error) {
      console.error(error); // Log error to console for debugging
      res.status(500).json({
        success: false,
        message: "An error occurred while creating the cart",
      });
      next(error); // Call the next middleware to handle the error if necessary
    }
  },

  // get all carts
  getAllCarts: async (req, res, next) => {
    try {
      const userId = req.user?.userId;

      // Validasi jika userId tidak ada
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is missing",
        });
      }

      // Mengambil semua carts milik user
      let carts = await prisma.carts.findMany({
        where: {
          userId: userId,
        },
      });

      // Mengirimkan response dengan data carts
      res.status(200).json({
        success: true,
        message: "Successfully retrieved carts",
        data: carts,
      });
    } catch (error) {
      console.error(error); // Log error untuk debugging
      res.status(500).json({
        success: false,
        message: "An error occurred while retrieving carts",
      });
      next(error); // Panggil middleware berikutnya untuk penanganan error
    }
  },

  // update carts
  updateCarts: async (req, res, next) => {
    try {
      let { cartId } = req.params;
      let usersId = req.user.userId;
      let { productId, qty } = req.body;

      // Validasi input
      if (!cartId) {
        return res.status(400).json({
          success: false,
          message: "Cart ID is required",
        });
      }

      if (!productId || qty === undefined || qty < 0) {
        return res.status(400).json({
          success: false,
          message: "Product ID and quantity are required",
        });
      }

      // Temukan pengguna berdasarkan ID
      let user = await prisma.users.findUnique({
        where: {
          userId: usersId,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          err: "User not found with id: " + usersId,
          data: null,
        });
      }

      // Temukan keranjang berdasarkan ID
      let findCarts = await prisma.carts.findUnique({
        where: {
          cartId: cartId,
        },
      });

      if (!findCarts) {
        return res.status(404).json({
          success: false,
          message: "Cart not found",
          err: "Cart not found with id " + cartId,
          data: null,
        });
      }

      // Perbarui keranjang
      let updateCarts = await prisma.carts.update({
        where: {
          cartId: cartId,
        },
        data: {
          productId,
          qty,
        },
      });

      res.status(200).json({
        success: true,
        message: "Successfully updated cart",
        data: updateCarts,
      });
    } catch (error) {
      console.error(error); // Log error to console for debugging
      res.status(500).json({
        success: false,
        message: "An error occurred while updating the cart",
      });
      next(error); // Call the next middleware to handle the error if necessary
    }
  },

  // delete Carts
  deleteCarts: async (req, res, next) => {
    try {
      let { cartId } = req.params;
      let userId = req.user.userId;

      // Temukan pengguna berdasarkan ID
      let user = await prisma.user.findUnique({
        where: {
          userId: userId,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          err: "User not found with id: " + userId,
          data: null,
        });
      }

      // Temukan keranjang berdasarkan ID
      let findCarts = await prisma.carts.findUnique({
        where: {
          cartId: cartId,
        },
        include: {
          users: true,
        },
      });

      if (!findCarts) {
        return res.status(404).json({
          success: false,
          message: "Carts not found",
          err: "Carts not found with id: " + cartId,
          data: null,
        });
      }

      // Kondisi jika carts tidak berhubungan dengan user
      if (findCarts.users.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized to delete this cart",
          err:
            "User with id: " +
            userId +
            " is not authorized to delete cart with id: " +
            cartId,
          data: null,
        });
      }

      // Hapus keranjang
      let deleteCarts = await prisma.carts.delete({
        where: {
          cartId: cartId,
        },
      });

      res.status(200).json({
        success: true,
        message: "Successfully deleted cart",
        data: deleteCarts,
      });
    } catch (error) {
      console.error(error); // Log error to console for debugging
      res.status(500).json({
        success: false,
        message: "An error occurred while deleting the cart",
      });
      next(error); // Call the next middleware to handle the error if necessary
    }
  },

  // get detail carts
  getDetailCarts: async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const cartId = req.params.cartId;

      // Inisialisasi user sesuai dengan carts
      let user = await prisma.users.findUnique({
        where: {
          userId: userId,
        },
      });

      // Kondisi user jika tidak sesuai dengan carts
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          err: "User not found with id: " + userId,
          data: null,
        });
      }

      let cart = await prisma.carts.findUnique({
        where: {
          cartId: cartId,
        },
      });

      // Kondisi jika carts tidak ditemukan
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: "Cart not found by id: " + cartId,
          err: null,
          data: null,
        });
      }

      // Kondisi jika carts tidak berhubungan dengan user
      if (cart.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access to cart with id: " + cartId,
          err: "User does not have access to this cart",
          data: null,
        });
      }

      // Mengirim detail cart jika ditemukan dan sesuai dengan user
      res.status(200).json({
        success: true,
        message: "Cart details retrieved successfully",
        data: cart,
      });
    } catch (error) {
      console.error(error); // Log error to console for debugging
      res.status(500).json({
        success: false,
        message: "An error occurred while retrieving the cart details",
      });
      next(error); // Call the next middleware to handle the error if necessary
    }
  },
};
