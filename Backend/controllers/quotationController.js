const pool = require("../config/db");

const calculateLineTotal = (quantity, unitPrice, discountPercent, gstPercent) => {
  const gross = quantity * unitPrice;
  const discount = gross * (discountPercent / 100);
  const taxable = gross - discount;
  const gst = taxable * (gstPercent / 100);

  return taxable + gst;
};

const getQuotations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        q.id,
        q.quotation_number,
        q.enquiry_id,
        q.valid_until,
        q.status,
        q.created_at,
        c.name AS customer_name
      FROM quotations q
      JOIN enquiries e ON e.id = q.enquiry_id
      JOIN customers c ON c.id = e.customer_id
      ORDER BY q.id DESC
    `);

    res.json({
      success: true,
      quotations: result.rows,
    });
  } catch (error) {
    console.error("Get quotations error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch quotations",
    });
  }
};

const createQuotation = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      quotationNumber,
      enquiryId,
      validUntil,
      items,
    } = req.body;

    if (!quotationNumber || !enquiryId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Quotation number, enquiry and items are required",
      });
    }

    await client.query("BEGIN");

    const enquiryResult = await client.query(
      "SELECT id, status FROM enquiries WHERE id = $1",
      [enquiryId]
    );

    if (enquiryResult.rows.length === 0) {
      throw new Error("Enquiry not found");
    }

    const quotationResult = await client.query(
      `
      INSERT INTO quotations
        (quotation_number, enquiry_id, valid_until, status)
      VALUES ($1, $2, $3, 'DRAFT')
      RETURNING *
      `,
      [quotationNumber, enquiryId, validUntil || null]
    );

    const quotation = quotationResult.rows[0];

    let grandTotal = 0;

    for (const item of items) {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const discountPercent = Number(item.discountPercent || 0);
      const gstPercent = Number(item.gstPercent || 0);

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0 ||
        discountPercent < 0 ||
        discountPercent > 100 ||
        gstPercent < 0
      ) {
        throw new Error("Invalid quotation item values");
      }

      const lineTotal = calculateLineTotal(
        quantity,
        unitPrice,
        discountPercent,
        gstPercent
      );

      grandTotal += lineTotal;

      await client.query(
        `
        INSERT INTO quotation_items
          (quotation_id, product_id, quantity, unit_price,
           discount_percent, gst_percent)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          quotation.id,
          item.productId,
          quantity,
          unitPrice,
          discountPercent,
          gstPercent,
        ]
      );
    }

    await client.query(
      "UPDATE enquiries SET status = 'QUOTED' WHERE id = $1",
      [enquiryId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Quotation created successfully",
      quotation: {
        ...quotation,
        grand_total: Number(grandTotal.toFixed(2)),
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create quotation error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to create quotation",
    });
  } finally {
    client.release();
  }
};

const updateQuotationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "DRAFT",
      "SENT",
      "ACCEPTED",
      "REJECTED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation status",
      });
    }

    const result = await pool.query(
      `
      UPDATE quotations
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    res.json({
      success: true,
      message: "Quotation status updated",
      quotation: result.rows[0],
    });
  } catch (error) {
    console.error("Update quotation status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update quotation status",
    });
  }
};

module.exports = {
  getQuotations,
  createQuotation,
  updateQuotationStatus,
};