const prisma = require("../libs/prisma");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  // create carts
  createCarts: async (req, res, next) => {
    try {
      let { qty = 1, productId } = req.body; // Set default qty to 1

      // Validate productId
      if (!productId) {
        return res.status(400).json({
          success: false,
          message: "Product ID is missing",
        });
      }

      // Validate that qty is a positive integer
      if (!Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid quantity",
        });
      }

      const cartId = uuidv4();
      const userId = req.user.userId;

      // Validate userId
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is missing",
        });
      }

      // Fetch product details
      const product = await prisma.products.findUnique({
        where: { productId: productId },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Determine the price to use
      const price = product.promoPrice ? product.promoPrice : product.price;

      let newCarts = await prisma.carts.create({
        data: {
          cartId: cartId,
          qty: qty,
          price: BigInt(price), // Store the determined price in the cart as BigInt
          userId: userId,
          productId: productId,
        },
      });

      // Convert BigInt to string for serialization
      newCarts = {
        ...newCarts,
        price: newCarts.price.toString(),
      };

      res.status(200).json({
        success: true,
        message: "Successfully created cart",
        data: newCarts,
      });
    } catch (error) {
      console.error(error); // Log error to console for debugging
      next(error); // Call the next middleware to handle the error if necessary
    }
  },

  // get all carts
  getAllCarts: async (req, res, next) => {
    try {
      const userId = req.user?.userId;

      // Validate if userId is missing
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is missing",
        });
      }

      // Fetch all carts belonging to the user that are not checked out, including product details
      let carts = await prisma.carts.findMany({
        where: {
          userId: userId,
          isCheckout: false, // Add this condition to filter out checked out carts
        },
        include: {
          products: {
            select: {
              name: true,
              image: true,
              price: true,
              promoPrice: true, // Include promoPrice
              stock: true,
            },
          },
        },
      });

      // Convert BigInt to string for serialization
      carts = carts.map((cart) => ({
        ...cart,
        price: cart.price.toString(), // Convert cart price to string
        products: {
          ...cart.products,
          price: cart.products.price.toString(), // Convert product price to string
          promoPrice: cart.products.promoPrice
            ? cart.products.promoPrice.toString()
            : null, // Convert promoPrice to string if it exists
        },
      }));

      // Send response with cart data
      res.status(200).json({
        success: true,
        message: "Successfully retrieved carts",
        data: carts,
      });
    } catch (error) {
      console.error(error); // Log error for debugging
      next(error); // Call the next middleware for error handling
    }
  },

  // update carts
  updateCarts: async (req, res, next) => {
    try {
      let { cartId } = req.params;
      let usersId = req.user.userId;
      let { qty } = req.body;

      // Validate input
      if (!cartId) {
        return res.status(400).json({
          success: false,
          message: "Cart ID is required",
        });
      }

      if (qty === undefined || qty < 0) {
        return res.status(400).json({
          success: false,
          message: "Quantity is required and must be non-negative",
        });
      }

      // Find user
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

      // Find cart
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

      // Update cart
      let updateCarts = await prisma.carts.update({
        where: {
          cartId: cartId,
        },
        data: {
          qty,
          // Avoid updating productId if it's not required; update only qty
        },
      });

      // Convert BigInt to string for serialization
      updateCarts = {
        ...updateCarts,
        price: updateCarts.price.toString(), // Convert cart price to string
      };

      res.status(200).json({
        success: true,
        message: "Successfully updated cart",
        data: updateCarts,
      });
    } catch (error) {
      console.error(error); // Log error to console for debugging
      next(error); // Call the next middleware to handle the error if necessary
    }
  },

  // delete Carts
  deleteCarts: async (req, res, next) => {
    try {
      let userId = req.user.userId;
      let { cartId } = req.params;

      // Temukan pengguna berdasarkan ID
      let user = await prisma.users.findUnique({
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

      // Convert BigInt to string for serialization
      deleteCarts = {
        ...deleteCarts,
        price: deleteCarts.price.toString(), // Convert cart price to string
      };

      res.status(200).json({
        success: true,
        message: "Successfully deleted cart",
        data: deleteCarts,
      });
    } catch (error) {
      console.error(error); // Log error to console for debugging
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
        include: {
          products: {
            select: {
              name: true,
              image: true,
              price: true,
              promoPrice: true, // Include promoPrice
              stock: true,
            },
          },
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

      // Convert BigInt to string for serialization
      cart = {
        ...cart,
        price: cart.price.toString(), // Convert cart price to string
        products: {
          ...cart.products,
          price: cart.products.price.toString(), // Convert product price to string
          promoPrice: cart.products.promoPrice
            ? cart.products.promoPrice.toString()
            : null, // Convert promoPrice to string if it exists
        },
      };

      // Mengirim detail cart jika ditemukan dan sesuai dengan user
      res.status(200).json({
        success: true,
        message: "Cart details retrieved successfully",
        data: cart,
      });
    } catch (error) {
      console.error(error); // Log error to console for debugging
      next(error); // Call the next middleware to handle the error if necessary
    }
  },
};
