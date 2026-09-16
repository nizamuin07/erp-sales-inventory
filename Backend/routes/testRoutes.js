const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/admin-test",
  authenticateToken,
  authorizeRoles("ADMIN"),
  (req, res) => {
    res.json({
      success: true,
      message: "Admin access granted",
      user: req.user,
    });
  }
);

router.get(
  "/sales-test",
  authenticateToken,
  authorizeRoles("SALES_USER", "ADMIN"),
  (req, res) => {
    res.json({
      success: true,
      message: "Sales access granted",
      user: req.user,
    });
  }
);

module.exports = router;