const pool = require("../config/db");

const getEnquiries = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        e.id,
        e.enquiry_number,
        e.enquiry_date,
        e.details,
        e.status,
        c.id AS customer_id,
        c.name AS customer_name,
        c.email AS customer_email,
        c.phone AS customer_phone
      FROM enquiries e
      JOIN customers c ON c.id = e.customer_id
      ORDER BY e.id DESC
    `);

    res.json({
      success: true,
      enquiries: result.rows,
    });
  } catch (error) {
    console.error("Get enquiries error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch enquiries",
    });
  }
};

const createEnquiry = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      enquiryNumber,
      customerId,
      enquiryDate,
      details,
      status,
      items,
    } = req.body;

    if (!enquiryNumber || !customerId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Enquiry number, customer and at least one product are required",
      });
    }

    await client.query("BEGIN");

    const enquiryResult = await client.query(
      `
      INSERT INTO enquiries
        (enquiry_number, customer_id, enquiry_date, details, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        enquiryNumber,
        customerId,
        enquiryDate || null,
        details || null,
        status || "NEW",
      ]
    );

    const enquiry = enquiryResult.rows[0];

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        throw new Error("Invalid enquiry item");
      }

      await client.query(
        `
        INSERT INTO enquiry_items
          (enquiry_id, product_id, quantity, notes)
        VALUES ($1, $2, $3, $4)
        `,
        [
          enquiry.id,
          item.productId,
          item.quantity,
          item.notes || null,
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Enquiry created successfully",
      enquiry,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create enquiry error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to create enquiry",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getEnquiries,
  createEnquiry,
};