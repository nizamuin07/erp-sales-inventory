# ERP Sales & Inventory Management System

A full-stack ERP application for managing the complete sales workflow:

**Customer Enquiry → Quotation → Sales Order → Inventory Reservation → Dispatch**

## Tech Stack

### Frontend
- React.js
- Vite
- JavaScript
- CSS
- Fetch API

### Backend
- Node.js
- Express.js
- REST APIs
- JWT Authentication
- bcryptjs
- PostgreSQL
- pg (node-postgres)

## User Roles

### ADMIN
- View customers and enquiries
- Create/manage quotations
- Create sales orders
- Confirm sales orders
- Reserve inventory
- Process dispatches
- View inventory

### SALES_USER
- Create customers
- Create enquiries
- Create quotations
- Convert accepted quotations into sales orders
- View inventory availability

## Main Workflow

1. User logs in using JWT authentication.
2. Customer and enquiry are created.
3. A quotation is created for the enquiry.
4. Quotation status is changed to ACCEPTED.
5. An accepted quotation can be converted into a sales order.
6. ADMIN confirms the sales order.
7. Inventory is reserved using a database transaction.
8. ADMIN dispatches the confirmed order.
9. Physical and reserved inventory quantities are updated.

## Database

PostgreSQL is used as the relational database.

Main tables:

- users
- customers
- products
- inventory
- enquiries
- enquiry_items
- quotations
- quotation_items
- sales_orders
- sales_order_items
- dispatches
- dispatch_items

The database uses primary keys, foreign keys, unique constraints, check constraints and transactions for maintaining data consistency.

## Project Structure

```text
erp-project/
│
├── Backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── server.js
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   └── App.css
    ├── package.json
    └── vite.config.js

