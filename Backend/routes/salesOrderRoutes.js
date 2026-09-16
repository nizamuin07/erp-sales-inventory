const express = require("express");

const {
  getSalesOrders,
  createSalesOrder,
} = require("../controllers/salesOrderController");

const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "SALES_USER"),
  getSalesOrders
);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "SALES_USER"),
  createSalesOrder
);

module.exports = router;