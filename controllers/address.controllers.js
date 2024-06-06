const prisma = require("../libs/prisma");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  // create address
  createAddress: async (req, res, next) => {
    try {
      const { nameAddress, address, city, country, postalCode } = req.body;
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
          userId: userId, // Asumsikan relasi user menggunakan userId secara langsung
        },
      });

      res.status(200).json({
        success: true,
        message: "Address created successfully",
        data: newAddress,
      });
    } catch (error) {
      console.error(error); // Log error to console for debugging
      res.status(500).json({
        success: false,
        message: "An error occurred while creating the address",
      });
      next(error); // Panggil middleware berikutnya untuk penanganan error
    }
  },

  // get all address
  getAllAddress: async (req, res, next) => {
    try {
      const userId = req.user.userId;

      const addresses = await prisma.address.findMany({
        where: {
          userId: userId,
        },
      });

      res.status(200).json({
        success: true,
        message: "Successfully retrieved addresses",
        data: addresses,
      });
    } catch (error) {
      console.error(error); // Log error to console for debugging
      res.status(500).json({
        success: false,
        message: "An error occurred while retrieving addresses",
      });
      next(error); // Panggil middleware berikutnya untuk penanganan error
    }
  },

  // update address
  updateAddress: async (req, res, next) => {
    try {
      const { addressId } = req.params;
      const userId = req.user.userId;
      const { nameAddress, address, city, country, postalCode } = req.body;

      // Cek ketersediaan user
      const user = await prisma.users.findUnique({
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

      // Cari alamat yang akan diperbarui
      const findAddress = await prisma.address.findUnique({
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

      // Perbarui alamat
      const updateAddress = await prisma.address.update({
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
      console.error(error); // Log error to console for debugging
      next(error);
    }
  },

  // delete address
  deleteAddress: async (req, res, next) => {
    try {
      const { addressId } = req.params;
      const userId = req.user.userId;

      // Cek ketersediaan user
      const user = await prisma.users.findUnique({
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

      // Cari alamat yang akan dihapus
      const findAddress = await prisma.address.findUnique({
        where: {
          addressId: addressId,
        },
        include: {
          users: true,
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

      // Periksa apakah alamat terkait dengan pengguna yang sedang masuk
      if (findAddress.users.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to delete this address",
          err: null,
          data: null,
        });
      }

      // Hapus alamat
      const deleteAddress = await prisma.address.delete({
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
      console.error(error); // Log error to console for debugging
      next(error);
    }
  },

  // get detail address
  getDetailAddress: async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const addressId = req.params.addressId;

      // Inisialisasi user sesuai dengan alamat
      const user = await prisma.users.findUnique({
        where: {
          userId: userId,
        },
      });

      // Pengecekan ketersediaan user
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          err: "User not found with id: " + userId,
          data: null,
        });
      }

      // Dapatkan detail alamat
      const address = await prisma.address.findUnique({
        where: {
          addressId: addressId,
        },
      });

      // Pengecekan ketersediaan alamat
      if (!address) {
        return res.status(404).json({
          success: false,
          message: "Address not found by id : " + addressId,
          err: null,
          data: null,
        });
      }

      // Pengecekan relasi antara alamat dan pengguna
      if (address.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this address",
          err: null,
          data: null,
        });
      }

      // Respons jika data alamat ditemukan
      return res.status(200).json({
        success: true,
        message: "Successfully get detail address",
        err: null,
        data: address,
      });
    } catch (error) {
      console.error(error); // Log error to console for debugging
      next(error);
    }
  },
};
