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
      let products;

      // Check if a search query is provided
      if (req.query.search) {
        const { search } = req.query;
        products = await prisma.products.findMany({
          where: {
            name: {
              contains: search,
              mode: "insensitive",
            },
            isDeleted: false,
          },
          include: {
            category: true,
            ratings: true,
          },
        });
      }
      // Check if a category filter is provided
      else if (req.query.category) {
        const { category } = req.query;
        products = await prisma.products.findMany({
          where: {
            category: {
              name: category, // Filter by category name directly
            },
            isDeleted: false,
          },
          include: {
            category: true,
            ratings: true,
          },
        });
      }
      // Check if a sort filter is provided
      else if (req.query.filter) {
        const { filter } = req.query;
        const filterOptions = {
          populer: { orderBy: { ratings: { _avg: "desc" } } },
          terbaru: { orderBy: { createdAt: "desc" } },
        };
        products = await prisma.products.findMany({
          ...filterOptions[filter],
          where: {
            isDeleted: false,
          },
          include: {
            category: true,
            ratings: true,
          },
        });
      }
      // Check if pagination is needed
      else if (req.query.page && req.query.limit) {
        const { page = 1, limit = 10 } = req.query;
        products = await prisma.products.findMany({
          where: { isDeleted: false },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          include: {
            category: true,
            ratings: true,
          },
        });
      }
      // Default case: no filters applied
      else {
        products = await prisma.products.findMany({
          where: { isDeleted: false },
          include: {
            category: true,
            ratings: true,
          },
        });
      }

      // Calculate averageRating for each product
      products.forEach((product) => {
        product.averageRating =
          product.ratings.reduce((sum, rating) => sum + rating.rating, 0) /
            product.ratings.length || 0;
      });

      return res.status(200).json({
        success: true,
        message: "Get all products successfully",
        data: products,
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
          ratings: true,
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

      // result jika product ditemukan
      res.status(200).json({
        success: true,
        message: "Get product successfully",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  },
};
