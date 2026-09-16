const pool = require("../config/db");

const getCustomers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, phone, address, created_at
      FROM customers
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      customers: result.rows,
    });
  } catch (error) {
    console.error("Get customers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
};

const createCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO customers (name, email, phone, address)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, phone, address, created_at
      `,
      [name, email || null, phone || null, address || null]
    );

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer: result.rows[0],
    });
  } catch (error) {
    console.error("Create customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create customer",
    });
  }
};

module.exports = {
  getCustomers,
  createCustomer,
};