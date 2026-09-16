const pool = require("../config/db");

const getSalesOrders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        so.id,
        so.order_number,
        so.quotation_id,
        so.customer_id,
        c.name AS customer_name,
        so.order_date,
        so.total_amount,
        so.status
      FROM sales_orders so
      JOIN customers c ON c.id = so.customer_id
      ORDER BY so.id DESC
    `);

    res.json({
      success: true,
      salesOrders: result.rows,
    });
  } catch (error) {
    console.error("Get sales orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch sales orders",
    });
  }
};

const createSalesOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const { orderNumber, quotationId } = req.body;

    if (!orderNumber || !quotationId) {
      return res.status(400).json({
        success: false,
        message: "Order number and quotation are required",
      });
    }

    await client.query("BEGIN");

    const quotationResult = await client.query(
      `
      SELECT
        q.id,
        q.status,
        e.customer_id
      FROM quotations q
      JOIN enquiries e ON e.id = q.enquiry_id
      WHERE q.id = $1
      `,
      [quotationId]
    );

    if (quotationResult.rows.length === 0) {
      throw new Error("Quotation not found");
    }

    const quotation = quotationResult.rows[0];

    if (quotation.status !== "ACCEPTED") {
      throw new Error(
        "Sales order can only be created from an ACCEPTED quotation"
      );
    }

    const existingOrder = await client.query(
      "SELECT id FROM sales_orders WHERE quotation_id = $1",
      [quotationId]
    );

    if (existingOrder.rows.length > 0) {
      throw new Error("Sales order already exists for this quotation");
    }

    const itemsResult = await client.query(
      `
      SELECT product_id, quantity, unit_price
      FROM quotation_items
      WHERE quotation_id = $1
      `,
      [quotationId]
    );

    if (itemsResult.rows.length === 0) {
      throw new Error("Quotation has no items");
    }

    let totalAmount = 0;

    for (const item of itemsResult.rows) {
      totalAmount += Number(item.quantity) * Number(item.unit_price);
    }

    const orderResult = await client.query(
      `
      INSERT INTO sales_orders
        (order_number, quotation_id, customer_id, total_amount, status)
      VALUES ($1, $2, $3, $4, 'PENDING')
      RETURNING *
      `,
      [
        orderNumber,
        quotationId,
        quotation.customer_id,
        totalAmount.toFixed(2),
      ]
    );

    const salesOrder = orderResult.rows[0];

    for (const item of itemsResult.rows) {
      await client.query(
        `
        INSERT INTO sales_order_items
          (sales_order_id, product_id, quantity, unit_price)
        VALUES ($1, $2, $3, $4)
        `,
        [
          salesOrder.id,
          item.product_id,
          item.quantity,
          item.unit_price,
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Sales order created successfully",
      salesOrder,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create sales order error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to create sales order",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getSalesOrders,
  createSalesOrder,
};