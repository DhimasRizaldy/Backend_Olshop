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

      const productId = uuidv4();

      let image = null;
      // validation image
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
};
