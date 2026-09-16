CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL,
    physical_quantity INTEGER NOT NULL DEFAULT 0
        CHECK (physical_quantity >= 0),
    reserved_quantity INTEGER NOT NULL DEFAULT 0
        CHECK (reserved_quantity >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_product
        FOREIGN KEY (product_id)
        REFERENCES products(id),

    CONSTRAINT chk_reserved_not_more_than_physical
        CHECK (reserved_quantity <= physical_quantity)
);
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE enquiries (
    id SERIAL PRIMARY KEY,
    enquiry_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    enquiry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    details TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW'
        CHECK (status IN ('NEW', 'QUOTED', 'WON', 'LOST')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_enquiry_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
);

CREATE TABLE enquiry_items (
    id SERIAL PRIMARY KEY,
    enquiry_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    notes TEXT,

    CONSTRAINT fk_enquiry_item_enquiry
        FOREIGN KEY (enquiry_id)
        REFERENCES enquiries(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_enquiry_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
);

CREATE TABLE quotations (
    id SERIAL PRIMARY KEY,
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    enquiry_id INTEGER NOT NULL,
    valid_until DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_quotation_enquiry
        FOREIGN KEY (enquiry_id)
        REFERENCES enquiries(id)
);

CREATE TABLE quotation_items (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0
        CHECK (discount_percent >= 0 AND discount_percent <= 100),
    gst_percent NUMERIC(5, 2) NOT NULL DEFAULT 0
        CHECK (gst_percent >= 0),

    CONSTRAINT fk_quotation_item_quotation
        FOREIGN KEY (quotation_id)
        REFERENCES quotations(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_quotation_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
);

CREATE TABLE sales_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    quotation_id INTEGER UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'CONFIRMED', 'DISPATCHED', 'CANCELLED')),

    CONSTRAINT fk_sales_order_quotation
        FOREIGN KEY (quotation_id)
        REFERENCES quotations(id),

    CONSTRAINT fk_sales_order_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
);

CREATE TABLE sales_order_items (
    id SERIAL PRIMARY KEY,
    sales_order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),

    CONSTRAINT fk_sales_order_item_order
        FOREIGN KEY (sales_order_id)
        REFERENCES sales_orders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_sales_order_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
);

CREATE TABLE dispatches (
    id SERIAL PRIMARY KEY,
    sales_order_id INTEGER UNIQUE NOT NULL,
    dispatch_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quantity_dispatched INTEGER NOT NULL CHECK (quantity_dispatched > 0),

    CONSTRAINT fk_dispatch_sales_order
        FOREIGN KEY (sales_order_id)
        REFERENCES sales_orders(id)
);