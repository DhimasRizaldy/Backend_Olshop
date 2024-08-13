const prisma = require("../libs/prisma");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  // create category
  createCategory: async (req, res, next) => {
    try {
      const { name } = req.body;
      const categoryId = uuidv4(); // Memberikan nilai unik untuk categoryId

      let newCategory = await prisma.categories.create({
        data: {
          categoryId: categoryId, // Memberikan nilai categoryId yang unik
          name: name,
        },
      });

      res.status(200).json({
        success: true,
        message: "Category created successfully",
        data: newCategory,
      });
    } catch (error) {
      next(error);
    }
  },

  // get all category
  getAllCategory: async (req, res, next) => {
    try {
      let categories = await prisma.categories.findMany();
      res.status(200).json({
        success: true,
        message: "Get all categories successfully",
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  },

  // update category
  updateCategory: async (req, res, next) => {
    try {
      const { categoryId } = req.params;
      const { name } = req.body;

      // Cari kategori yang akan diperbarui
      const findCategory = await prisma.categories.findUnique({
        where: {
          categoryId: categoryId,
        },
      });

      // Periksa apakah kategori ditemukan
      if (!findCategory) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
          err: "Category not found with id: " + categoryId,
          data: null,
        });
      }

      // Perbarui kategori
      const updateCategory = await prisma.categories.update({
        where: {
          categoryId: categoryId,
        },
        data: {
          name: name,
        },
      });

      res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: updateCategory,
      });
    } catch (error) {
      next(error);
    }
  },

  // delete category
  deleteCategory: async (req, res, next) => {
    try {
      const { categoryId } = req.params;

      // Cari kategori yang akan dihapus
      const findCategory = await prisma.categories.findUnique({
        where: {
          categoryId: categoryId,
        },
      });

      // Periksa apakah kategori ditemukan
      if (!findCategory) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
          err: "Category not found with id: " + categoryId,
          data: null,
        });
      }

      // Hapus kategori
      const deleteCategory = await prisma.categories.delete({
        where: {
          categoryId: categoryId,
        },
      });
      res.status(200).json({
        success: true,
        message: "Category deleted successfully",
        data: deleteCategory,
      });
    } catch (error) {
      next(error);
    }
  },

  // get category by id
  getCategoryById: async (req, res, next) => {
    try {
      const { categoryId } = req.params;
      const category = await prisma.categories.findUnique({
        where: {
          categoryId: categoryId,
        },
      });
      res.status(200).json({
        success: true,
        message: "Get category successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  },
};

