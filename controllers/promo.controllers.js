const { number } = require("joi");
const prisma = require("../libs/prisma");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  // create promo
  createPromo: async (req, res, next) => {
    try {
      let { codePromo, activeAt, expiresAt } = req.body;
      let discount = parseInt(req.body.discount, 10);

      const promoId = uuidv4();

      let newPromo = await prisma.promo.create({
        data: {
          promoId,
          codePromo,
          discount,
          activeAt,
          expiresAt,
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
      let promo = await prisma.promo.findMany();
      res.status(200).json({
        success: true,
        message: "Get all promo successfully",
        data: promo,
      });
    } catch (error) {
      next(error);
    }
  },

  // update promo
  updatePromo: async (req, res, next) => {
    try {
      let { promoId } = req.params;
      let { codePromo, discount, activeAt, expiresAt } = req.body;

      let findPromo = await prisma.promo.findUnique({
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

      let updatePromo = await prisma.promo.update({
        where: {
          promoId: promoId,
        },
        data: {
          codePromo,
          discount,
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
      let { promoId } = req.params;
      let findPromo = await prisma.promo.findUnique({
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

      let deletePromo = await prisma.promo.delete({
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
};
