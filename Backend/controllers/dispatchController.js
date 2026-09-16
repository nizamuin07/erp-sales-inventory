const pool = require("../config/db");

const getDispatches = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        d.id,
        d.dispatch_number,
        d.sales_order_id,
        so.order_number,
        d.dispatch_date,
        d.vehicle_number,
        d.driver_name
      FROM dispatches d
      JOIN sales_orders so ON so.id = d.sales_order_id
      ORDER BY d.id DESC
    `);

    res.json({
      success: true,
      dispatches: result.rows,
    });
  } catch (error) {
    console.error("Get dispatches error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dispatches",
    });
  }
};

const createDispatch = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      dispatchNumber,
      salesOrderId,
      vehicleNumber,
      driverName,
    } = req.body;

    if (!dispatchNumber || !salesOrderId) {
      return res.status(400).json({
        success: false,
        message: "Dispatch number and sales order are required",
      });
    }

    await client.query("BEGIN");

    // Only CONFIRMED orders can be dispatched
    const orderResult = await client.query(
      `
      SELECT id, status
      FROM sales_orders
      WHERE id = $1
      FOR UPDATE
      `,
      [salesOrderId]
    );

    if (orderResult.rows.length === 0) {
      throw new Error("Sales order not found");
    }

    const order = orderResult.rows[0];

    if (order.status !== "CONFIRMED") {
      throw new Error("Only CONFIRMED orders can be dispatched");
    }

    // Prevent duplicate dispatch
    const existingDispatch = await client.query(
      "SELECT id FROM dispatches WHERE sales_order_id = $1",
      [salesOrderId]
    );

    if (existingDispatch.rows.length > 0) {
      throw new Error("Sales order has already been dispatched");
    }

    const orderItems = await client.query(
      `
      SELECT product_id, quantity
      FROM sales_order_items
      WHERE sales_order_id = $1
      `,
      [salesOrderId]
    );

    if (orderItems.rows.length === 0) {
      throw new Error("Sales order has no items");
    }

    // Check all reserved quantities first
    for (const item of orderItems.rows) {
      const inventoryResult = await client.query(
        `
        SELECT reserved_quantity, physical_quantity
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

      if (Number(item.quantity) > Number(inventory.reserved_quantity)) {
        throw new Error(
          `Dispatch quantity exceeds reserved quantity for product ${item.product_id}`
        );
      }
    }

    // Create dispatch
    const dispatchResult = await client.query(
      `
      INSERT INTO dispatches
        (dispatch_number, sales_order_id, vehicle_number, driver_name)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        dispatchNumber,
        salesOrderId,
        vehicleNumber || null,
        driverName || null,
      ]
    );

    const dispatch = dispatchResult.rows[0];

    // Reduce physical + reserved inventory
    for (const item of orderItems.rows) {
      await client.query(
        `
        INSERT INTO dispatch_items
          (dispatch_id, product_id, quantity_dispatched)
        VALUES ($1, $2, $3)
        `,
        [dispatch.id, item.product_id, item.quantity]
      );

      await client.query(
        `
        UPDATE inventory
        SET
          physical_quantity = physical_quantity - $1,
          reserved_quantity = reserved_quantity - $1
        WHERE product_id = $2
        `,
        [item.quantity, item.product_id]
      );
    }

    // Mark order dispatched
    const updatedOrder = await client.query(
      `
      UPDATE sales_orders
      SET status = 'DISPATCHED'
      WHERE id = $1
      RETURNING *
      `,
      [salesOrderId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Order dispatched successfully",
      dispatch,
      salesOrder: updatedOrder.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create dispatch error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to create dispatch",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getDispatches,
  createDispatch,
};