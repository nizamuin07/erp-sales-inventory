-- Seed products
INSERT INTO products (sku, name, description, unit_price)
VALUES
('LAP-001', 'Business Laptop', '15-inch business laptop', 65000.00),
('MON-001', 'LED Monitor', '24-inch Full HD monitor', 12000.00),
('KEY-001', 'Mechanical Keyboard', 'Wireless mechanical keyboard', 4500.00),
('MOU-001', 'Wireless Mouse', 'Ergonomic wireless mouse', 1800.00),
('HDD-001', 'External SSD', '1TB portable SSD', 8500.00),
('PRN-001', 'Laser Printer', 'Monochrome laser printer', 15000.00);

-- Seed inventory
INSERT INTO inventory (product_id, physical_quantity, reserved_quantity)
VALUES
(1, 100, 0),
(2, 150, 0),
(3, 200, 0),
(4, 250, 0),
(5, 100, 0),
(6, 50, 0);