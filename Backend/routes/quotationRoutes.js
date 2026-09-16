const express = require("express");

const {
  getQuotations,
  createQuotation,
  updateQuotationStatus,
} = require("../controllers/quotationController");

const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "SALES_USER"),
  getQuotations
);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "SALES_USER"),
  createQuotation
);

router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles("ADMIN", "SALES_USER"),
  updateQuotationStatus
);

module.exports = router;