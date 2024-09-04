const prisma = require("../libs/prisma");
const path = require("path");
const imagekit = require("../libs/imagekit");
const { v4: uuidv4 } = require("uuid");
const { getPagination } = require("../libs/getPagination");

module.exports = {
  createProduct: async (req, res, next) => {
    try {
      const { name, categoryId, description } = req.body;
      let { price, promoPrice, weight, stock } = req.body;
      // Konversi string ke angka
      price = parseFloat(price);
      promoPrice = parseFloat(promoPrice);
      weight = parseFloat(weight);
      stock = parseInt(stock, 10);

      // Cek ketersediaan kategori
      const category = await prisma.categories.findUnique({
        where: {
          categoryId: categoryId,
        },
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
          err: "Category not found with id: " + categoryId,
          data: null,
        });
      }

      const productId = uuidv4();

      let image = null;
      // validasi gambar
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
          price,
          promoPrice,
          weight,
          stock,
          description,
          image,
        },
        include: {
          category: true,
        },
      });

      res.status(200).json({
        success: true,
        message: "Product created successfully",
        data: newProduct,
      });
    } catch (error) {
      next(error);
    }
  },

  // gets all products
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
            where: { isCheckout: true }, // Hanya hitung yang sudah di-checkout
          },
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      };

      // Apply search filter
      if (search) {
        baseQuery.where.name = {
          contains: search,
          mode: "insensitive",
        };
      }

      // Apply category filter
      if (category) {
        baseQuery.where.category = {
          name: category,
        };
      }

      // Apply sort filter
      if (filter) {
        const filterOptions = {
          populer: { orderBy: { ratings: { _avg: "desc" } } },
          terbaru: { orderBy: { createdAt: "desc" } },
        };
        baseQuery.orderBy = filterOptions[filter].orderBy;
      }

      // Fetch products
      const products = await prisma.products.findMany(baseQuery);

      // Calculate averageRating, totalSold, and totalReview
      const productsWithStats = products.map((product) => {
        const averageRating =
          product.ratings.reduce((sum, rating) => sum + rating.rating, 0) /
            product.ratings.length || 0;

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
        };
      });

      // Apply rating filters if provided
      const filteredProducts = productsWithStats.filter((product) => {
        return (
          (!minRating || product.averageRating >= minRating) &&
          (!maxRating || product.averageRating <= maxRating)
        );
      });

      return res.status(200).json({
        success: true,
        message: "Get all products successfully",
        data: filteredProducts,
      });
    } catch (error) {
      next(error);
    }
  },

  // update product
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

      const product = await prisma.products.findUnique({
        where: {
          productId: productId,
        },
      });

      // kondisi jika product tidak ditemukan
      if (!product || product.isDeleted) {
        return res.status(404).json({
          success: false,
          message: "Product not found by id : " + productId,
          err: null,
          data: null,
        });
      }

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

      let updateProduct = await prisma.products.update({
        where: {
          productId: productId,
        },
        data: {
          name,
          categoryId,
          price: parseInt(price, 10),
          promoPrice: parseInt(promoPrice, 10),
          weight: parseInt(weight, 10),
          stock: parseInt(stock, 10),
          description,
          image: imageUrl,
        },
      });

      // kondisi jika update product gagal
      if (!updateProduct) {
        return res.status(500).json({
          success: false,
          message: "Update product failed",
          err: null,
          data: null,
        });
      }

      // result jika update product sukses
      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: updateProduct,
      });
    } catch (error) {
      next(error);
    }
  },

  // delete product
  deleteProduct: async (req, res, next) => {
    try {
      const { productId } = req.params;
      const product = await prisma.products.findUnique({
        where: {
          productId: productId,
          isDeleted: false,
        },
      });

      // kondisi jika product tidak ditemukan
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found by id : " + productId,
          err: null,
          data: null,
        });
      }

      let deleteProduct = await prisma.products.update({
        where: {
          productId: productId,
        },
        data: {
          isDeleted: true,
        },
      });

      // kondisi jika delete product gagal
      if (!deleteProduct) {
        return res.status(500).json({
          success: false,
          message: "Delete product failed",
          err: null,
          data: null,
        });
      }

      // result jika delete product sukses
      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
        data: deleteProduct,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get product by id
  getDetailProduct: async (req, res, next) => {
    try {
      const productId = req.params.productId;

      const product = await prisma.products.findUnique({
        where: {
          productId: productId,
        },
        include: {
          category: true,
          ratings: {
            include: {
              users: {
                select: {
                  username: true, // Hanya pilih username
                },
              },
              products: {
                select: {
                  name: true, // Hanya pilih nama produk
                },
              },
            },
          },
          carts: {
            where: { isCheckout: true }, // Hanya hitung yang sudah di-checkout
          },
        },
      });

      // Kondisi jika produk tidak ditemukan
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found by id : " + productId,
          err: null,
          data: null,
        });
      }

      // Hitung totalSold
      const totalSold = product.carts.reduce(
        (total, cart) => total + cart.qty,
        0
      );

      // Hitung totalReview
      const totalReview = product.ratings.length;

      // Hasil jika produk ditemukan, termasuk totalSold dan totalReview
      res.status(200).json({
        success: true,
        message: "Get product successfully",
        data: {
          ...product,
          totalSold, // Tambahkan totalSold ke dalam data produk
          totalReview, // Tambahkan totalReview ke dalam data produk
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
