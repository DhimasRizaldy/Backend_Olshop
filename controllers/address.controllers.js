const prisma = require("../libs/prisma");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  // create address
  createAddress: async (req, res, next) => {
    try {
      let { nameAddress, address, city, country, postalCode } = req.body;
      const addressId = uuidv4();
      const userId = req.user.userId;

      let newAddress = await prisma.address.create({
        data: {
          addressId: addressId,
          nameAddress: nameAddress,
          address: address,
          city: city,
          country: country,
          postalCode: postalCode,
          users: {
            connect: { userId: userId },
          },
        },
      });
      res.status(200).json({
        success: true,
        message: "Address created successfully",
        data: newAddress,
      });
    } catch (error) {
      next(error);
    }
  },

  // get all address
  getAllAddress: async (req, res, next) => {
    try {
      const userId = req.user.userId;
      let address = await prisma.address.findMany({
        where: {
          userId: userId,
        },
      });

      res.status(200).json({
        success: true,
        message: "Address fetched successfully",
        data: address,
      });
    } catch (error) {
      next(error);
    }
  },

  // update address
  updateAddress: async (req, res, next) => {
    try {
      let { addressId } = req.params;
      let userId = req.user.userId;
      let { nameAddress, address, city, country, postalCode } = req.body;

      let user = prisma.users.findUnique({
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

      let findAddress = prisma.address.findUnique({
        where: {
          addressId: addressId,
        },
      });
      if (!findAddress) {
        return res.status(404).json({
          success: false,
          message: "Address not found",
          err: "Address not found with id: " + addressId,
          data: null,
        });
      }

      let updateAddress = await prisma.address.update({
        where: {
          addressId: addressId,
        },
        data: {
          nameAddress,
          address,
          city,
          country,
          postalCode,
        },
      });
      res.status(200).json({
        success: true,
        message: "Address updated successfully",
        data: updateAddress,
      });
    } catch (error) {
      next(error);
    }
  },

  // delete address
  deleteAddress: async (req, res, next) => {
    try {
      let { addressId } = req.params;
      let userId  = req.user.userId;

      let user = prisma.users.findUnique({
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

      let findAddress = prisma.address.findUnique({
        where: {
          addressId: addressId,
        },
      });
      if (!findAddress) {
        return res.status(404).json({
          success: false,
          message: "Address not found",
          err: "Address not found with id: " + addressId,
          data: null,
        });
      }

      let deleteAddress = await prisma.address.delete({
        where: {
          addressId: addressId,
        },
      });
      res.status(200).json({
        success: true,
        message: "Address deleted successfully",
        data: deleteAddress,
      });
    } catch (error) {
      next(error);
    }
  },
};
