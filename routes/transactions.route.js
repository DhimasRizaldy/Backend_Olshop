const router = require("express").Router();

const {
  createTransaction,
  getAllTransaction,
  getDetailTransaction,
  updateTransaction,
  deleteTransaction,
  getAllTransactionAdmin,
} = require("../controllers/transactions.controllers");
const verifyToken = require("../middlewares/verifyToken");
const verifyAdmin = require("../middlewares/verifyAdmin");

// route transaction

router.post("/", verifyToken, createTransaction);
router.get("/", verifyToken, getAllTransaction);
router.get("/:transactionId", verifyToken, getDetailTransaction);
router.put("/:transactionId", verifyToken, updateTransaction);
router.delete("/:transactionId", verifyToken, deleteTransaction);
router.get("/", verifyAdmin, getAllTransactionAdmin);

module.exports = router;
