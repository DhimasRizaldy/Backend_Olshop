const prisma = require("../libs/prisma");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  // create manageStok
  createManageStock: async (req, res, next) => {
    try {
      const { supplierId, productId, stockIn, purchasePrice } = req.body;
      const manageStockId = uuidv4();

      // Validasi supplier
      const supplier = await prisma.suppliers.findUnique({
        where: {
          supplierId: supplierId,
        },
      });
      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: "Supplier not found with id: " + supplierId,
          err: null,
          data: null,
        });
      }

      // Validasi product
      const product = await prisma.products.findUnique({
        where: {
          productId: productId,
        },
      });
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found with id: " + productId,
          err: null,
          data: null,
        });
      }

      // Menambahkan stok baru ke ManageStock
      const newManageStock = await prisma.manageStock.create({
        data: {
          manageStockId: manageStockId,
          supplierId,
          productId,
          stockIn,
          purchasePrice: purchasePrice ? BigInt(purchasePrice) : null, // Konversi ke BigInt jika ada
          dateStockIn: new Date(),
        },
      });

      // Update stok di Products
      const updatedProduct = await prisma.products.update({
        where: {
          productId: productId,
        },
        data: {
          stock: {
            increment: stockIn, // Menambahkan stok sesuai dengan stockIn
          },
        },
      });

      // Convert BigInt to string for serialization
      const serializedNewManageStock = {
        ...newManageStock,
        purchasePrice: newManageStock.purchasePrice
          ? newManageStock.purchasePrice.toString()
          : null,
      };

      const serializedUpdatedProduct = {
        ...updatedProduct,
        price: updatedProduct.price.toString(),
        promoPrice: updatedProduct.promoPrice
          ? updatedProduct.promoPrice.toString()
          : null,
      };

      res.status(200).json({
        success: true,
        message: "Manage stock created successfully",
        data: {
          newManageStock: serializedNewManageStock,
          updatedProduct: serializedUpdatedProduct,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // update manageStok
  updateManageStok: async (req, res, next) => {
    try {
      const { manageStockId } = req.params;
      const { stockIn, purchasePrice } = req.body;

      // Mencari entri ManageStock berdasarkan ID
      const existingManageStock = await prisma.manageStock.findUnique({
        where: {
          manageStockId: manageStockId,
        },
      });

      // Kondisi jika entri ManageStock tidak ditemukan
      if (!existingManageStock) {
        return res.status(404).json({
          success: false,
          message: "Manage stock not found",
          data: null,
        });
      }

      // Memperbarui jumlah stok masuk
      const updatedManageStock = await prisma.manageStock.update({
        where: {
          manageStockId: manageStockId,
        },
        data: {
          stockIn: stockIn,
          purchasePrice: purchasePrice ? BigInt(purchasePrice) : null, // Konversi ke BigInt jika ada
        },
      });

      // Convert BigInt to string for serialization
      const serializedUpdatedManageStock = {
        ...updatedManageStock,
        purchasePrice: updatedManageStock.purchasePrice
          ? updatedManageStock.purchasePrice.toString()
          : null,
      };

      res.status(200).json({
        success: true,
        message: "Manage stock updated successfully",
        data: serializedUpdatedManageStock,
      });
    } catch (error) {
      next(error);
    }
  },

  // delete manageStok
  deleteManageStok: async (req, res, next) => {
    try {
      const { manageStockId } = req.params;

      // Mencari entri ManageStock yang akan dihapus
      const manageStock = await prisma.manageStock.findUnique({
        where: {
          manageStockId: manageStockId,
        },
      });

      // Jika tidak ada entri dengan ID yang sesuai, kirim respons 404
      if (!manageStock) {
        return res.status(404).json({
          success: false,
          message: "Manage stock not found",
          data: null,
        });
      }

      // Jika entri ditemukan, hapus dari basis data
      await prisma.manageStock.delete({
        where: {
          manageStockId: manageStockId,
        },
      });

      // Kirim respons 200 jika penghapusan berhasil
      return res.status(200).json({
        success: true,
        message: "Manage stock deleted successfully",
        data: manageStock,
      });
    } catch (error) {
      // Tangani kesalahan jika terjadi
      next(error);
    }
  },

  // get all manageStok
  getAllManageStock: async (req, res, next) => {
    try {
      // Mengambil semua data dari tabel ManageStock
      const manageStock = await prisma.manageStock.findMany({
        include: {
          supplier: true, // Mengikutsertakan informasi supplier
          product: true, // Mengikutsertakan informasi product
        },
      });

      // Convert BigInt to string for serialization
      const serializedManageStock = manageStock.map((stock) => ({
        ...stock,
        purchasePrice: stock.purchasePrice
          ? stock.purchasePrice.toString()
          : null,
        product: {
          ...stock.product,
          price: stock.product.price.toString(),
          promoPrice: stock.product.promoPrice
            ? stock.product.promoPrice.toString()
            : null,
        },
      }));

      res.status(200).json({
        success: true,
        message: "Get all manage stock successfully",
        data: serializedManageStock,
      });
    } catch (error) {
      next(error);
    }
  },

  // get manageStok by id
  getManageStokById: async (req, res, next) => {
    try {
      const { manageStockId } = req.params;

      // Cari entri ManageStock berdasarkan ID yang diberikan
      const manageStock = await prisma.manageStock.findUnique({
        where: {
          manageStockId: manageStockId,
        },
        include: {
          supplier: true,
          product: true,
        },
      });

      // Jika entri tidak ditemukan, kirim respons 404
      if (!manageStock) {
        return res.status(404).json({
          success: false,
          message: "Manage stock not found",
          data: null,
        });
      }

      // Convert BigInt to string for serialization
      const serializedManageStock = {
        ...manageStock,
        purchasePrice: manageStock.purchasePrice
          ? manageStock.purchasePrice.toString()
          : null,
        product: {
          ...manageStock.product,
          price: manageStock.product.price.toString(),
          promoPrice: manageStock.product.promoPrice
            ? manageStock.product.promoPrice.toString()
            : null,
        },
      };

      // Jika entri ditemukan, kirimkan sebagai respons
      return res.status(200).json({
        success: true,
        message: "Manage stock found successfully",
        data: serializedManageStock,
      });
    } catch (error) {
      // Tangani kesalahan jika terjadi
      next(error);
    }
  },
};
