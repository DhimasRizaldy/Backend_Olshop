const prisma = require("../libs/prisma");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  // create category
  createCategory: async (req, res, next) => {
    try {
      let { name } = req.body;
      const categoryId = uuidv4();

      let newcategory = await prisma.categories.create({
        data: {
          categoryId,
          name,
        },
      });

      res.status(200).json({
        success: true,
        message: "Category created successfully",
        data: newcategory,
      });
    } catch (error) {
      next(error);
    }
  },

  // get all category
  getAllCategory: async (req, res, next) => {
    try {
      let category = await prisma.categories.findMany();
      res.status(200).json({
        success: true,
        message: "Get all category successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  },

  // update category
  updateCategory: async (req, res, next) => {
    try {
      let { categoryId } = req.params;
      let { name } = req.body;

      let findCategory = await prisma.categories.findUnique({
        where: {
          categoryId: categoryId,
        },
      });

      if (!findCategory) {
        return res.status(404).json({
          success: false,
          message: "Not found",
          err: "Category not found with id: " + categoryId,
          data: null,
        });
      }

      let updateCategory = await prisma.categories.update({
        where: {
          categoryId: categoryId,
        },
        data: {
          name,
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
      let { categoryId } = req.params;
      let findCategory = await prisma.categories.findUnique({
        where: {
          categoryId: categoryId,
        },
      });

      if (!findCategory) {
        return res.status(404).json({
          success: false,
          message: "Not found",
          err: "Category not found with id: " + categoryId,
          data: null,
        });
      }

      let deleteCategory = await prisma.categories.delete({
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
};
