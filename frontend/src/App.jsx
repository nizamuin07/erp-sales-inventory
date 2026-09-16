import { useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

const products = [
  { id: 1, name: "Business Laptop", price: 65000 },
  { id: 2, name: "LED Monitor", price: 12000 },
  { id: 3, name: "Mechanical Keyboard", price: 4500 },
  { id: 4, name: "Wireless Mouse", price: 1800 },
  { id: 5, name: "External SSD", price: 8500 },
  { id: 6, name: "Laser Printer", price: 15000 },
];

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );

  const [activeTab, setActiveTab] = useState("enquiries");
  const [message, setMessage] = useState("");

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <Login onLogin={login} message={message} />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>ERP Sales & Inventory</h1>
          <p>Customer → Enquiry → Quotation → Sales Order → Dispatch</p>
        </div>

        <div className="user-box">
          <span>
            {user?.name} ({user?.role})
          </span>

          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={activeTab === "enquiries" ? "active" : ""}
          onClick={() => setActiveTab("enquiries")}
        >
          Enquiries
        </button>

        <button
          className={activeTab === "quotations" ? "active" : ""}
          onClick={() => setActiveTab("quotations")}
        >
          Quotations
        </button>

        <button
          className={activeTab === "orders" ? "active" : ""}
          onClick={() => setActiveTab("orders")}
        >
          Sales Orders
        </button>

        <button
          className={activeTab === "inventory" ? "active" : ""}
          onClick={() => setActiveTab("inventory")}
        >
          Inventory
        </button>

        <button
          className={activeTab === "dispatch" ? "active" : ""}
          onClick={() => setActiveTab("dispatch")}
        >
          Dispatch
        </button>
      </nav>

      <main className="content">
        {activeTab === "enquiries" && (
          <Enquiries
            token={token}
            setMessage={setMessage}
            message={message}
          />
        )}

        {activeTab === "quotations" && (
          <Quotations
            token={token}
            setMessage={setMessage}
            message={message}
          />
        )}

        {activeTab === "orders" && (
          <SalesOrders
            token={token}
            user={user}
            setMessage={setMessage}
            message={message}
          />
        )}

        {activeTab === "inventory" && (
          <Inventory
            token={token}
            setMessage={setMessage}
            message={message}
          />
        )}

        {activeTab === "dispatch" && (
          <Dispatch
            token={token}
            setMessage={setMessage}
            message={message}
          />
        )}
      </main>
    </div>
  );
}

/* ================= LOGIN ================= */

function Login({ onLogin, message }) {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin@123");

  const submitLogin = (event) => {
    event.preventDefault();

    if (!email || !password) {
      return;
    }

    onLogin(email, password);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>ERP System</h1>
        <p>Sales & Inventory Management</p>

        <form onSubmit={submitLogin}>
          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button type="submit">Login</button>
        </form>

        {message && <div className="error">{message}</div>}

        <small>Admin: admin@example.com / Admin@123</small>
      </div>
    </div>
  );
}

/* ================= ENQUIRIES ================= */

function Enquiries({ token, setMessage, message }) {
  const [enquiries, setEnquiries] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [enquiryNumber, setEnquiryNumber] = useState(
    `ENQ-${Date.now().toString().slice(-6)}`
  );

  const [productId, setProductId] = useState(1);
  const [quantity, setQuantity] = useState(1);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const loadEnquiries = async () => {
    try {
      const response = await fetch(`${API}/enquiries`, {
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch enquiries");
      }

      setEnquiries(data.enquiries || []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch(`${API}/customers`, {
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch customers");
      }

      setCustomers(data.customers || []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const load = async () => {
    await Promise.all([loadEnquiries(), loadCustomers()]);
  };

  const createEnquiry = async (event) => {
    event.preventDefault();

    try {
      let selectedCustomerId = customerId;

      /* New customer */
      if (!selectedCustomerId) {
        if (!customerName.trim()) {
          throw new Error("Please enter customer name");
        }

        const customerResponse = await fetch(`${API}/customers`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: customerName.trim(),
            email: customerEmail.trim() || null,
          }),
        });

        const customerData = await customerResponse.json();

        if (!customerResponse.ok) {
          throw new Error(
            customerData.message || "Failed to create customer"
          );
        }

        selectedCustomerId = customerData.customer.id;
      }

      /* Create enquiry */
      const enquiryResponse = await fetch(`${API}/enquiries`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          enquiryNumber,
          customerId: Number(selectedCustomerId),

          enquiryDate: new Date().toISOString().split("T")[0],

          details: "Customer product enquiry",

          status: "NEW",

          items: [
            {
              productId: Number(productId),
              quantity: Number(quantity),
            },
          ],
        }),
      });

      const enquiryData = await enquiryResponse.json();

      if (!enquiryResponse.ok) {
        throw new Error(
          enquiryData.message || "Failed to create enquiry"
        );
      }

      setMessage("Enquiry created successfully");

      setCustomerName("");
      setCustomerEmail("");
      setCustomerId("");
      setQuantity(1);

      setEnquiryNumber(
        `ENQ-${Date.now().toString().slice(-6)}`
      );

      await load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section>
      <h2>Enquiries</h2>

      <form className="card form-grid" onSubmit={createEnquiry}>
        <div>
          <label>Existing Customer</label>

          <select
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
          >
            <option value="">-- New Customer --</option>

            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        {!customerId && (
          <>
            <div>
              <label>Customer Name</label>

              <input
                type="text"
                value={customerName}
                onChange={(event) =>
                  setCustomerName(event.target.value)
                }
                placeholder="ABC Technologies"
              />
            </div>

            <div>
              <label>Email</label>

              <input
                type="email"
                value={customerEmail}
                onChange={(event) =>
                  setCustomerEmail(event.target.value)
                }
                placeholder="abc@gmail.com"
              />
            </div>
          </>
        )}

        <div>
          <label>Enquiry Number</label>

          <input
            value={enquiryNumber}
            onChange={(event) =>
              setEnquiryNumber(event.target.value)
            }
            required
          />
        </div>

        <div>
          <label>Product</label>

          <select
            value={productId}
            onChange={(event) =>
              setProductId(event.target.value)
            }
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Quantity</label>

          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(event) =>
              setQuantity(event.target.value)
            }
            required
          />
        </div>

        <button type="submit">Create Enquiry</button>
      </form>

      {message && <p className="success">{message}</p>}

      <button className="secondary" onClick={load}>
        Refresh Enquiries
      </button>

      <Table
        columns={[
          "Enquiry",
          "Customer",
          "Date",
          "Status",
        ]}
        rows={enquiries.map((enquiry) => [
          enquiry.enquiry_number,
          enquiry.customer_name,
          enquiry.enquiry_date,
          enquiry.status,
        ])}
      />
    </section>
  );
}

/* ================= QUOTATIONS ================= */

function Quotations({ token, setMessage, message }) {
  const [quotations, setQuotations] = useState([]);
  const [enquiryId, setEnquiryId] = useState("");

  const [quotationNumber, setQuotationNumber] = useState(
    `QUO-${Date.now().toString().slice(-6)}`
  );

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const load = async () => {
    try {
      const response = await fetch(`${API}/quotations`, {
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch quotations");
      }

      setQuotations(data.quotations || []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const createQuotation = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${API}/quotations`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          quotationNumber,
          enquiryId: Number(enquiryId),

          items: [
            {
              productId: 1,
              quantity: 1,
              unitPrice: 65000,
              discountPercent: 0,
              gstPercent: 18,
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create quotation"
        );
      }

      setMessage(
        `Quotation created. Total: ₹${data.quotation.grand_total}`
      );

      setEnquiryId("");

      setQuotationNumber(
        `QUO-${Date.now().toString().slice(-6)}`
      );

      await load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const response = await fetch(
        `${API}/quotations/${id}/status`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update status");
      }

      setMessage(data.message);
      await load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section>
      <h2>Quotations</h2>

      <form className="card form-grid" onSubmit={createQuotation}>
        <div>
          <label>Enquiry ID</label>

          <input
            type="number"
            min="1"
            value={enquiryId}
            onChange={(event) =>
              setEnquiryId(event.target.value)
            }
            placeholder="Example: 1"
            required
          />
        </div>

        <div>
          <label>Quotation Number</label>

          <input
            value={quotationNumber}
            onChange={(event) =>
              setQuotationNumber(event.target.value)
            }
            required
          />
        </div>

        <button type="submit">Create Quotation</button>
      </form>

      {message && <p className="success">{message}</p>}

      <button className="secondary" onClick={load}>
        Refresh Quotations
      </button>

      <Table
        columns={[
          "Quotation",
          "Enquiry",
          "Customer",
          "Status",
          "Action",
        ]}
        rows={quotations.map((quotation) => [
          quotation.quotation_number,
          quotation.enquiry_id,
          quotation.customer_name,
          quotation.status,

          <select
            key={quotation.id}
            value={quotation.status}
            onChange={(event) =>
              updateStatus(
                quotation.id,
                event.target.value
              )
            }
          >
            <option value="DRAFT">DRAFT</option>
            <option value="SENT">SENT</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="REJECTED">REJECTED</option>
          </select>,
        ])}
      />
    </section>
  );
}

/* ================= SALES ORDERS ================= */

function SalesOrders({
  token,
  user,
  setMessage,
  message,
}) {
  const [orders, setOrders] = useState([]);
  const [quotationId, setQuotationId] = useState("");

  const [orderNumber, setOrderNumber] = useState(
    `SO-${Date.now().toString().slice(-6)}`
  );

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const load = async () => {
    try {
      const response = await fetch(`${API}/sales-orders`, {
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch sales orders"
        );
      }

      setOrders(data.salesOrders || []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const createOrder = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${API}/sales-orders`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          orderNumber,
          quotationId: Number(quotationId),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create sales order"
        );
      }

      setMessage("Sales order created successfully");

      setQuotationId("");

      setOrderNumber(
        `SO-${Date.now().toString().slice(-6)}`
      );

      await load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const confirmOrder = async (id) => {
    try {
      const response = await fetch(
        `${API}/inventory/sales-orders/${id}/confirm`,
        {
          method: "PATCH",
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to confirm order"
        );
      }

      setMessage(data.message);

      await load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section>
      <h2>Sales Orders</h2>

      <form className="card form-grid" onSubmit={createOrder}>
        <div>
          <label>Accepted Quotation ID</label>

          <input
            type="number"
            min="1"
            value={quotationId}
            onChange={(event) =>
              setQuotationId(event.target.value)
            }
            placeholder="Example: 1"
            required
          />
        </div>

        <div>
          <label>Order Number</label>

          <input
            value={orderNumber}
            onChange={(event) =>
              setOrderNumber(event.target.value)
            }
            required
          />
        </div>

        <button type="submit">
          Create Sales Order
        </button>
      </form>

      {message && <p className="success">{message}</p>}

      <button className="secondary" onClick={load}>
        Refresh Orders
      </button>

      <Table
        columns={[
          "Order",
          "Customer",
          "Total",
          "Status",
          "Action",
        ]}
        rows={orders.map((order) => [
          order.order_number,
          order.customer_name,
          `₹${order.total_amount}`,
          order.status,

          user?.role === "ADMIN" &&
          order.status === "PENDING" ? (
            <button
              key={order.id}
              onClick={() => confirmOrder(order.id)}
            >
              Confirm & Reserve
            </button>
          ) : (
            "-"
          ),
        ])}
      />
    </section>
  );
}

/* ================= INVENTORY ================= */

function Inventory({ token, setMessage, message }) {
  const [items, setItems] = useState([]);

  const load = async () => {
    try {
      const response = await fetch(`${API}/inventory`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch inventory"
        );
      }

      setItems(data.inventory || []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section>
      <h2>Inventory Availability</h2>

      <button className="secondary" onClick={load}>
        Refresh Inventory
      </button>

      {message && <p className="success">{message}</p>}

      <Table
        columns={[
          "SKU",
          "Product",
          "Physical",
          "Reserved",
          "Available",
        ]}
        rows={items.map((item) => [
          item.sku,
          item.name,
          item.physical_quantity,
          item.reserved_quantity,
          item.available_quantity,
        ])}
      />
    </section>
  );
}

/* ================= DISPATCH ================= */

function Dispatch({ token, setMessage, message }) {
  const [orderId, setOrderId] = useState("");

  const [dispatchNumber, setDispatchNumber] = useState(
    `DIS-${Date.now().toString().slice(-6)}`
  );

  const [vehicle, setVehicle] = useState("");
  const [driver, setDriver] = useState("");
  const [dispatches, setDispatches] = useState([]);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const load = async () => {
    try {
      const response = await fetch(`${API}/dispatches`, {
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch dispatches"
        );
      }

      setDispatches(data.dispatches || []);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const dispatchOrder = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${API}/dispatches`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          dispatchNumber,
          salesOrderId: Number(orderId),
          vehicleNumber: vehicle.trim() || null,
          driverName: driver.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to dispatch order"
        );
      }

      setMessage("Order dispatched successfully");

      setOrderId("");
      setVehicle("");
      setDriver("");

      setDispatchNumber(
        `DIS-${Date.now().toString().slice(-6)}`
      );

      await load();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section>
      <h2>Dispatch</h2>

      <form
        className="card form-grid"
        onSubmit={dispatchOrder}
      >
        <div>
          <label>Confirmed Sales Order ID</label>

          <input
            type="number"
            min="1"
            value={orderId}
            onChange={(event) =>
              setOrderId(event.target.value)
            }
            placeholder="Example: 1"
            required
          />
        </div>

        <div>
          <label>Dispatch Number</label>

          <input
            value={dispatchNumber}
            onChange={(event) =>
              setDispatchNumber(event.target.value)
            }
            required
          />
        </div>

        <div>
          <label>Vehicle Number</label>

          <input
            value={vehicle}
            onChange={(event) =>
              setVehicle(event.target.value)
            }
            placeholder="RJ14AB1234"
          />
        </div>

        <div>
          <label>Driver Name</label>

          <input
            value={driver}
            onChange={(event) =>
              setDriver(event.target.value)
            }
            placeholder="Driver name"
          />
        </div>

        <button type="submit">
          Dispatch Order
        </button>
      </form>

      {message && <p className="success">{message}</p>}

      <button className="secondary" onClick={load}>
        Refresh Dispatches
      </button>

      <Table
        columns={[
          "Dispatch",
          "Order",
          "Vehicle",
          "Driver",
          "Date",
        ]}
        rows={dispatches.map((dispatch) => [
          dispatch.dispatch_number,
          dispatch.order_number,
          dispatch.vehicle_number || "-",
          dispatch.driver_name || "-",
          new Date(
            dispatch.dispatch_date
          ).toLocaleString(),
        ])}
      />
    </section>
  );
}

/* ================= TABLE ================= */

function Table({ columns, rows }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                No data
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;