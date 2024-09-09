const prisma = require("../libs/prisma");
const path = require("path");
const imagekit = require("../libs/imagekit");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  createProduct: async (req, res, next) => {
    try {
      const { name, categoryId, description } = req.body;
      let { price, promoPrice, weight, stock } = req.body;

      // Convert to BigInt and handle optional values
      price = BigInt(price); // Assume price is already in the smallest unit (e.g., cents)
      promoPrice = promoPrice ? BigInt(promoPrice) : null;
      weight = parseFloat(weight);
      stock = parseInt(stock, 10);

      // Check if category exists
      const category = await prisma.categories.findUnique({
        where: { categoryId },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
          err: `Category not found with id: ${categoryId}`,
          data: null,
        });
      }

      const productId = uuidv4();

      let image = null;
      // Validate image
      if (req.file) {
        const strFile = req.file.buffer.toString("base64");
        const { url } = await imagekit.upload({
          fileName: Date.now() + path.extname(req.file.originalname),
          file: strFile,
        });
        image = url;
      }

      const newProduct = await prisma.products.create({
        data: {
          productId,
          name,
          categoryId,
          price: price.toString(), // Convert BigInt to string
          promoPrice: promoPrice ? promoPrice.toString() : null,
          weight,
          stock,
          description,
          image,
        },
        include: { category: true },
      });

      // Convert BigInt to string for serialization
      const serializedProduct = {
        ...newProduct,
        price: newProduct.price.toString(),
        promoPrice: newProduct.promoPrice
          ? newProduct.promoPrice.toString()
          : null,
      };

      res.status(200).json({
        success: true,
        message: "Product created successfully",
        data: serializedProduct,
      });
    } catch (error) {
      next(error);
    }
  },

  getAllProduct: async (req, res, next) => {
    try {
      const {
        search,
        category,
        filter,
        minRating,
        maxRating,
        page = 1,
        limit = 100,
      } = req.query;

      // Build base query
      const baseQuery = {
        where: { isDeleted: false },
        include: {
          category: true,
          ratings: true,
          carts: {
            where: { isCheckout: true },
          },
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      };

      // Apply filters
      if (search) {
        baseQuery.where.name = {
          contains: search,
          mode: "insensitive",
        };
      }

      if (category) {
        baseQuery.where.category = { name: category };
      }

      if (filter) {
        const filterOptions = {
          populer: { orderBy: { ratings: { _avg: "desc" } } },
          terbaru: { orderBy: { createdAt: "desc" } },
        };
        baseQuery.orderBy = filterOptions[filter]?.orderBy || {};
      }

      // Fetch products
      const products = await prisma.products.findMany(baseQuery);

      // Check if products are fetched correctly
      // console.log("Fetched Products:", products);

      // Process products
      const productsWithStats = products.map((product) => {
        const averageRating = product.ratings.length
          ? product.ratings.reduce((sum, rating) => sum + rating.rating, 0) /
            product.ratings.length
          : 0;

        const totalSold = product.carts.reduce(
          (total, cart) => total + cart.qty,
          0
        );
        const totalReview = product.ratings.length;

        return {
          ...product,
          averageRating,
          totalSold,
          totalReview,
          price: product.price.toString(), // Convert BigInt to string
          promoPrice: product.promoPrice ? product.promoPrice.toString() : null, // Convert BigInt to string
        };
      });

      // Apply rating filters
      const filteredProducts = productsWithStats.filter(
        (product) =>
          (!minRating || product.averageRating >= minRating) &&
          (!maxRating || product.averageRating <= maxRating)
      );

      res.status(200).json({
        success: true,
        message: "Get all products successfully",
        data: filteredProducts,
      });
    } catch (error) {
      console.error("Error in getAllProduct:", error); // Debugging error
      next(error);
    }
  },

  updateProduct: async (req, res, next) => {
    try {
      const { productId } = req.params;
      const {
        name,
        categoryId,
        price,
        promoPrice,
        weight,
        stock,
        description,
      } = req.body;

      // Check if product exists
      const product = await prisma.products.findUnique({
        where: { productId },
      });

      if (!product || product.isDeleted) {
        return res.status(404).json({
          success: false,
          message: "Product not found by id : " + productId,
          err: null,
          data: null,
        });
      }

      // Handle image
      let imageUrl = product.image;
      const imageFile = req.file;
      if (imageFile) {
        const strFile = imageFile.buffer.toString("base64");
        const { url: uploadedUrl } = await imagekit.upload({
          fileName: Date.now() + path.extname(imageFile.originalname),
          file: strFile,
        });
        imageUrl = uploadedUrl;
      }

      // Update product
      let updatedProduct = await prisma.products.update({
        where: { productId },
        data: {
          name,
          categoryId,
          price: BigInt(price).toString(), // Convert BigInt to string
          promoPrice: promoPrice ? BigInt(promoPrice).toString() : null,
          weight: parseFloat(weight),
          stock: parseInt(stock, 10),
          description,
          image: imageUrl,
        },
      });

      // Convert BigInt to string for serialization
      updatedProduct = {
        ...updatedProduct,
        price: updatedProduct.price.toString(),
        promoPrice: updatedProduct.promoPrice
          ? updatedProduct.promoPrice.toString()
          : null,
      };

      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: updatedProduct,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteProduct: async (req, res, next) => {
    try {
      const { productId } = req.params;
      const product = await prisma.products.findUnique({
        where: { productId, isDeleted: false },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found by id : " + productId,
          err: null,
          data: null,
        });
      }

      const deletedProduct = await prisma.products.update({
        where: { productId },
        data: { isDeleted: true },
      });

      // Convert BigInt to string for serialization
      const serializedProduct = {
        ...deletedProduct,
        price: deletedProduct.price.toString(),
        promoPrice: deletedProduct.promoPrice
          ? deletedProduct.promoPrice.toString()
          : null,
      };

      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
        data: serializedProduct,
      });
    } catch (error) {
      next(error);
    }
  },

  getDetailProduct: async (req, res, next) => {
    try {
      const productId = req.params.productId;

      // Fetch the product details
      const product = await prisma.products.findUnique({
        where: { productId },
        include: {
          category: true,
          ratings: {
            include: {
              users: { select: { username: true } },
              products: { select: { name: true } },
            },
          },
          carts: { where: { isCheckout: true } },
        },
      });

      // Handle product not found
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found by id : " + productId,
          err: null,
          data: null,
        });
      }

      // Convert BigInt to string for serialization
      const productWithConvertedValues = {
        ...product,
        price: product.price ? product.price.toString() : null,
        promoPrice: product.promoPrice ? product.promoPrice.toString() : null,
        totalSold: product.carts.reduce((total, cart) => total + cart.qty, 0),
        totalReview: product.ratings.length,
      };

      // Send the response
      res.status(200).json({
        success: true,
        message: "Get product successfully",
        data: productWithConvertedValues,
      });
    } catch (error) {
      next(error);
    }
  },
};
