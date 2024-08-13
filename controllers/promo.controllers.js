const prisma = require("../libs/prisma");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  // create promo
  createPromo: async (req, res, next) => {
    try {
      let { codePromo, activeAt, expiresAt, discount } = req.body;
      discount = parseInt(discount, 10); // Konversi ke bilangan bulat

      if (isNaN(discount)) {
        // Periksa apakah input adalah angka
        return res.status(400).json({
          success: false,
          message: "Discount must be a number",
          data: null,
        });
      }

      const promoId = uuidv4();

      let newPromo = await prisma.promo.create({
        data: {
          promoId,
          codePromo,
          discount,
          activeAt: new Date(activeAt),
          expiresAt: new Date(expiresAt),
        },
      });

      res.status(200).json({
        success: true,
        message: "Promo created successfully",
        data: newPromo,
      });
    } catch (error) {
      next(error);
    }
  },

  // get all promo
  getAllPromo: async (req, res, next) => {
    try {
      // Mendapatkan semua promo dari database
      let promo = await prisma.promo.findMany();

      // Mengirim respons sukses dengan data promo
      res.status(200).json({
        success: true,
        message: "Get all promo successfully",
        data: promo,
      });
    } catch (error) {
      // Menangani kesalahan
      next(error);
    }
  },

  // update promo
  updatePromo: async (req, res, next) => {
    try {
      const { promoId } = req.params;
      const { codePromo, discount, activeAt, expiresAt } = req.body;

      const findPromo = await prisma.promo.findUnique({
        where: {
          promoId: promoId,
        },
      });

      if (!findPromo) {
        return res.status(404).json({
          success: false,
          message: "Not found",
          err: "Promo not found with id: " + promoId,
          data: null,
        });
      }

      const updatePromo = await prisma.promo.update({
        where: {
          promoId: promoId,
        },
        data: {
          codePromo,
          discount: parseInt(discount, 10),
          activeAt,
          expiresAt,
        },
      });

      res.status(200).json({
        success: true,
        message: "Promo updated successfully",
        data: updatePromo,
      });
    } catch (error) {
      next(error);
    }
  },

  // delete promo
  deletePromo: async (req, res, next) => {
    try {
      const { promoId } = req.params;
      const findPromo = await prisma.promo.findUnique({
        where: {
          promoId: promoId,
        },
      });

      if (!findPromo) {
        return res.status(404).json({
          success: false,
          message: "Not found",
          err: "Promo not found with id: " + promoId,
          data: null,
        });
      }

      const deletePromo = await prisma.promo.delete({
        where: {
          promoId: promoId,
        },
      });

      res.status(200).json({
        success: true,
        message: "Promo deleted successfully",
        data: deletePromo,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get detail promo
  getDetailPromo: async (req, res, next) => {
    try {
      const { promoId } = req.params;

      const promo = await prisma.promo.findUnique({
        where: {
          promoId: promoId,
        },
      });

      if (!promo) {
        return res.status(404).json({
          success: false,
          message: "Promo not found by id: " + promoId,
          err: null,
          data: null,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Successfully retrieved promo details",
        err: null,
        data: promo,
      });
    } catch (error) {
      next(error);
    }
  },
};
