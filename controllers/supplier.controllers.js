const prisma = require("../libs/prisma");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  // create supplier
  createSupplier: async (req, res, next) => {
    try {
      let { name, email, address, phoneNumber } = req.body;
      const supplierId = uuidv4();

      let newSupplier = await prisma.suppliers.create({
        data: {
          supplierId,
          name,
          email,
          address,
          phoneNumber,
        },
      });

      res.status(200).json({
        success: true,
        message: "Supplier created successfully",
        data: newSupplier,
      });
    } catch (error) {
      next(error);
    }
  },

  // get all supplier
  getAllSupplier: async (req, res, next) => {
    try {
      let supplier = await prisma.suppliers.findMany();
      res.status(200).json({
        success: true,
        message: "Get all supplier successfully",
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  },

  // update supplier
  updateSupplier: async (req, res, next) => {
    try {
      let { supplierId } = req.params;
      let { name, email, address, phoneNumber } = req.body;

      let findSupplier = await prisma.suppliers.findUnique({
        where: {
          supplierId: supplierId,
        },
      });

      if (!findSupplier) {
        return res.status(404).json({
          success: false,
          message: "Not found",
          err: "Supplier not found with id: " + supplierId,
          data: null,
        });
      }

      let updateSupplier = await prisma.suppliers.update({
        where: {
          supplierId: supplierId,
        },
        data: {
          name,
          email,
          address,
          phoneNumber,
        },
      });

      res.status(200).json({
        success: true,
        message: "Supplier updated successfully",
        data: updateSupplier,
      });
    } catch (error) {
      next(error);
    }
  },

  // delete supplier
  deleteSupplier: async (req, res, next) => {
    try {
      let { supplierId } = req.params;
      let findSupplier = await prisma.suppliers.findUnique({
        where: {
          supplierId: supplierId,
        },
      });

      if (!findSupplier) {
        return res.status(404).json({
          success: false,
          message: "Not found",
          err: "Supplier not found with id: " + supplierId,
          data: null,
        });
      }

      let deleteSupplier = await prisma.suppliers.delete({
        where: {
          supplierId: supplierId,
        },
      });

      res.status(200).json({
        success: true,
        message: "Supplier deleted successfully",
        data: deleteSupplier,
      });
    } catch (error) {
      next(error);
    }
  },
};
