const router = require("express").Router();

const {
  getAllTransactionMe,
  getDetailTransaction,
  updateTransaction,
  deleteTransaction,
  getAllTransaction,
} = require("../controllers/transactions.controllers");
const verifyToken = require("../middlewares/verifyToken");
const verifyAdmin = require("../middlewares/verifyAdmin");

// route transaction

router.get("/", verifyToken, verifyAdmin, getAllTransaction);
router.get("/me", verifyToken, getAllTransactionMe);
router.get("/:transactionId", verifyToken, getDetailTransaction);
router.put("/:transactionId", verifyToken, verifyAdmin, updateTransaction); 
router.delete("/:transactionId", verifyToken, deleteTransaction);

module.exports = router;
