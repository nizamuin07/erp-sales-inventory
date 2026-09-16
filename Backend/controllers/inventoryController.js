const pool = require("../config/db");

const getInventory = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        i.id,
        i.product_id,
        p.sku,
        p.name,
        i.physical_quantity,
        i.reserved_quantity,
        (i.physical_quantity - i.reserved_quantity) AS available_quantity
      FROM inventory i
      JOIN products p ON p.id = i.product_id
      ORDER BY i.id
    `);

    res.json({
      success: true,
      inventory: result.rows,
    });
  } catch (error) {
    console.error("Get inventory error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch inventory",
    });
  }
};

const confirmSalesOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    const orderResult = await client.query(
      `
      SELECT id, status
      FROM sales_orders
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (orderResult.rows.length === 0) {
      throw new Error("Sales order not found");
    }

    const order = orderResult.rows[0];

    if (order.status !== "PENDING") {
      throw new Error("Only PENDING orders can be confirmed");
    }

    const itemsResult = await client.query(
      `
      SELECT product_id, quantity
      FROM sales_order_items
      WHERE sales_order_id = $1
      `,
      [id]
    );

    for (const item of itemsResult.rows) {
      const inventoryResult = await client.query(
        `
        SELECT physical_quantity, reserved_quantity
        FROM inventory
        WHERE product_id = $1
        FOR UPDATE
        `,
        [item.product_id]
      );

      if (inventoryResult.rows.length === 0) {
        throw new Error(`Inventory not found for product ${item.product_id}`);
      }

      const inventory = inventoryResult.rows[0];

      const available =
        inventory.physical_quantity - inventory.reserved_quantity;

      if (Number(item.quantity) > Number(available)) {
        throw new Error(
          `Insufficient inventory for product ${item.product_id}`
        );
      }

      await client.query(
        `
        UPDATE inventory
        SET reserved_quantity = reserved_quantity + $1
        WHERE product_id = $2
        `,
        [item.quantity, item.product_id]
      );
    }

    const updatedOrder = await client.query(
      `
      UPDATE sales_orders
      SET status = 'CONFIRMED'
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Sales order confirmed and inventory reserved",
      salesOrder: updatedOrder.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Confirm order error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to confirm sales order",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getInventory,
  confirmSalesOrder,
};