const express = require("express");

const {
  getInventory,
  confirmSalesOrder,
} = require("../controllers/inventoryController");

const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "SALES_USER"),
  getInventory
);

router.patch(
  "/sales-orders/:id/confirm",
  authenticateToken,
  authorizeRoles("ADMIN"),
  confirmSalesOrder
);

module.exports = router;