const prisma = require("../libs/prisma");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  // create supplier
  createSupplier: async (req, res, next) => {
    try {
      const { name, email, address, phoneNumber } = req.body;
      const supplierId = uuidv4();

      // Check if email already exists
      const emailExists = await prisma.suppliers.findFirst({
        where: { email },
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }

      // Check if phone number already exists
      const phoneExists = await prisma.suppliers.findFirst({
        where: { phoneNumber },
      });

      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: "Phone number already in use",
        });
      }

      const newSupplier = await prisma.suppliers.create({
        data: {
          supplierId,
          name,
          email,
          address,
          phoneNumber,
        },
      });

      res.status(201).json({
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
      const suppliers = await prisma.suppliers.findMany();
      res.status(200).json({
        success: true,
        message: "Get all suppliers successfully",
        data: suppliers,
      });
    } catch (error) {
      next(error);
    }
  },

  // update supplier
  updateSupplier: async (req, res, next) => {
    try {
      const { supplierId } = req.params;
      const { name, email, address, phoneNumber } = req.body;

      const findSupplier = await prisma.suppliers.findUnique({
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

      // Check if email already exists and is not the current supplier's email
      const emailExists = await prisma.suppliers.findFirst({
        where: {
          email,
          NOT: {
            supplierId: supplierId,
          },
        },
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }

      // Check if phone number already exists and is not the current supplier's phone number
      const phoneExists = await prisma.suppliers.findFirst({
        where: {
          phoneNumber,
          NOT: {
            supplierId: supplierId,
          },
        },
      });

      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: "Phone number already in use",
        });
      }

      const updatedSupplier = await prisma.suppliers.update({
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
        data: updatedSupplier,
      });
    } catch (error) {
      next(error);
    }
  },

  // delete supplier
  deleteSupplier: async (req, res, next) => {
    try {
      const { supplierId } = req.params;

      const findSupplier = await prisma.suppliers.findUnique({
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

      const deletedSupplier = await prisma.suppliers.delete({
        where: {
          supplierId: supplierId,
        },
      });

      res.status(200).json({
        success: true,
        message: "Supplier deleted successfully",
        data: deletedSupplier,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get supplier by id
  getDetailSupplier: async (req, res, next) => {
    try {
      const { supplierId } = req.params;

      const supplier = await prisma.suppliers.findUnique({
        where: {
          supplierId: supplierId,
        },
      });

      // Kondisi jika supplier tidak ditemukan
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: "Supplier not found by id: " + supplierId,
          err: null,
          data: null,
        });
      }

      // Respons jika supplier ditemukan
      return res.status(200).json({
        success: true,
        message: "Successfully retrieved supplier details",
        err: null,
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  },
};
