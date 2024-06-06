const prisma = require("../libs/prisma");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  // create ratings
  createRatings: async (req, res, next) => {
    try {
      const { productId, rating, image, review } = req.body;
      const userId = req.user.userId;
      const ratingId = uuidv4();

      // Validasi nilai rating
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating should be between 1 and 5",
          data: null,
        });
      }

      // Membuat entri baru dalam tabel Ratings
      const newRating = await prisma.ratings.create({
        data: {
          ratingId,
          userId: userId,
          productId,
          rating,
          image,
          review,
        },
      });

      // Mengirimkan respons sukses
      return res.status(200).json({
        success: true,
        message: "Rating created successfully",
        data: newRating,
      });
    } catch (error) {
      // Tangani kesalahan jika terjadi
      next(error);
    }
  },

  // get all ratings
  getAllRatings: async (req, res, next) => {
    try {
      // Mengambil semua entri dari tabel Ratings
      const allRatings = await prisma.ratings.findMany();

      // Mengirimkan respons sukses bersama dengan daftar semua penilaian
      return res.status(200).json({
        success: true,
        message: "Get all ratings successfully",
        data: allRatings,
      });
    } catch (error) {
      // Tangani kesalahan jika terjadi
      next(error);
    }
  },

  // update ratings
  updateRatings: async (req, res, next) => {
    try {
      // Mengambil ID penilaian dari parameter
      const { ratingId } = req.params;
      const userId = req.user.userId;

      // Mengambil data yang ingin diperbarui dari body permintaan
      const { rating, image, review } = req.body;

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

      // Cek ketersediaan penilaian
      const ratingExists = await prisma.ratings.findUnique({
        where: {
          ratingId: ratingId,
        },
      });
      if (!ratingExists) {
        return res.status(404).json({
          success: false,
          message: "Rating not found",
          err: "Rating not found with id: " + ratingId,
          data: null,
        });
      }

      // Memperbarui penilaian dengan menggunakan fungsi update dari Prisma
      const updatedRating = await prisma.ratings.update({
        where: {
          ratingId: ratingId,
        },
        data: {
          rating: rating,
          review: review,
        },
      });

      // Jika penilaian tidak ditemukan, kirim respons 404
      if (!updatedRating) {
        return res.status(404).json({
          success: false,
          message: "Rating not found by id: " + ratingId,
          err: null,
          data: null,
        });
      }

      // Mengirimkan respons sukses bersama dengan data penilaian yang telah diperbarui
      return res.status(200).json({
        success: true,
        message: "Rating updated successfully",
        data: updatedRating,
      });
    } catch (error) {
      // Tangani kesalahan jika terjadi
      next(error);
    }
  },

  // delete ratings
  deleteRatings: async (req, res, next) => {
    try {
      // Mendapatkan ID penilaian dari parameter
      const { ratingId } = req.params;

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

      // cari penilaian berdasarkan ID
      const ratingExists = await prisma.ratings.findUnique({
        where: {
          ratingId: ratingId,
        },
      });
      if (!ratingExists) {
        return res.status(404).json({
          success: false,
          message: "Rating not found",
          err: "Rating not found with id: " + ratingId,
          data: null,
        });
      }

      // Cek apakah penilaian milik user yang mengakses
      if (ratingExists.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to delete this rating",
          err: null,
          data: null,
        });
      }

      // Menghapus penilaian berdasarkan ID menggunakan fungsi delete dari Prisma
      const deletedRating = await prisma.ratings.delete({
        where: {
          ratingId: ratingId,
        },
      });

      // Mengirimkan respons sukses bersama dengan data penilaian yang telah dihapus
      return res.status(200).json({
        success: true,
        message: "Rating deleted successfully",
        data: deletedRating,
      });
    } catch (error) {
      // Tangani kesalahan jika terjadi
      next(error);
    }
  },

  // get detail ratings
  getDetailRatings: async (req, res, next) => {
    try {
      // Mendapatkan ID penilaian dari parameter
      const { ratingId } = req.params;

      // Mengambil detail penilaian berdasarkan ID menggunakan fungsi findUnique dari Prisma
      const rating = await prisma.ratings.findUnique({
        where: {
          ratingId: ratingId,
        },
      });

      // Jika penilaian tidak ditemukan, kirim respons 404
      if (!rating) {
        return res.status(404).json({
          success: false,
          message: "Rating not found by id: " + ratingId,
          err: null,
          data: null,
        });
      }

      // Jika penilaian ditemukan, kirim respons 200 bersama dengan data penilaian
      return res.status(200).json({
        success: true,
        message: "Successfully get detail rating",
        err: null,
        data: rating,
      });
    } catch (error) {
      // Tangani kesalahan jika terjadi
      next(error);
    }
  },
};
