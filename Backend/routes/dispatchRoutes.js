const express = require("express");

const {
  getDispatches,
  createDispatch,
} = require("../controllers/dispatchController");

const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN", "SALES_USER"),
  getDispatches
);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  createDispatch
);

module.exports = router;
