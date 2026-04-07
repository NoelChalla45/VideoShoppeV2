// Employee view of customer details and purchase/rental activity.
import { useEffect, useMemo, useState } from "react";
import "../styles/employee.css";
import { apiFetchJson } from "../utils/api";
import { getToken } from "../utils/auth";

export default function CustomerActivity() {
  const token = getToken();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerDetail, setCustomerDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetchJson("/api/orders/customers", {
          token,
          errorMessage: "Failed to load customers.",
        });
        setCustomers(data);
        if (data[0]?.id) {
          setSelectedCustomerId(data[0].id);
        }
      } catch (err) {
        setError(err.message || "Failed to load customers.");
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, [token]);

  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerDetail(null);
      return;
    }

    const loadCustomerDetail = async () => {
      setDetailLoading(true);
      setError("");
      try {
        const data = await apiFetchJson(`/api/orders/customers/${selectedCustomerId}`, {
          token,
          errorMessage: "Failed to load customer details.",
        });
        setCustomerDetail(data);
      } catch (err) {
        setError(err.message || "Failed to load customer details.");
        setCustomerDetail(null);
      } finally {
        setDetailLoading(false);
      }
    };

    loadCustomerDetail();
  }, [selectedCustomerId, token]);

  const customerOrders = customerDetail?.orders || [];
  const customer = customerDetail?.customer || null;
  const orderSummary = useMemo(() => {
    return customerOrders.reduce(
      (acc, order) => {
        acc.totalSpent += Number(order.totalAmount || 0);
        order.items.forEach((item) => {
          if (item.orderType === "PURCHASE") {
            acc.totalPurchases += Number(item.quantity || 0);
          } else {
            acc.totalRentals += Number(item.quantity || 0);
          }
        });
        return acc;
      },
      { totalSpent: 0, totalPurchases: 0, totalRentals: 0 }
    );
  }, [customerOrders]);

  return (
    <div className="employee-page">
      <div className="employee-inner">
        <header className="employee-head">
          <div>
            <p className="employee-eyebrow">Employee Operations</p>
            <h1>Customer Activity</h1>
          </div>
        </header>

        {error && <p className="employee-error">{error}</p>}

        <section className="employee-panel">
          <h2>Customers</h2>
          {loading ? (
            <p className="employee-empty">Loading customers...</p>
          ) : customers.length === 0 ? (
            <p className="employee-empty">No customers found yet.</p>
          ) : (
            <div className="employee-customers-layout">
              <div className="employee-customer-list">
                {customers.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={`employee-customer-btn ${selectedCustomerId === entry.id ? "active" : ""}`}
                    onClick={() => setSelectedCustomerId(entry.id)}
                  >
                    <strong>{entry.name || entry.email}</strong>
                    <span>{entry.email}</span>
                  </button>
                ))}
              </div>

              <aside className="employee-customer-detail">
                {!selectedCustomerId ? (
                  <p className="employee-empty">Select a customer to view details.</p>
                ) : detailLoading ? (
                  <p className="employee-empty">Loading customer details...</p>
                ) : !customer ? (
                  <p className="employee-empty">Customer details unavailable.</p>
                ) : (
                  <>
                    <div className="employee-customer-head">
                      <div>
                        <h3>{customer.name || "Customer"}</h3>
                        <p>{customer.email}</p>
                      </div>
                    </div>

                    <div className="employee-account-details">
                      <article>
                        <span>Phone</span>
                        <strong>{customer.phone || "N/A"}</strong>
                      </article>
                      <article>
                        <span>Address</span>
                        <strong>{customer.address || "N/A"}</strong>
                      </article>
                      <article>
                        <span>Member Since</span>
                        <strong>{new Date(customer.createdAt).toLocaleDateString()}</strong>
                      </article>
                      <article>
                        <span>Status</span>
                        <strong>{customer.isActive ? "Active" : "Inactive"}</strong>
                      </article>
                      <article>
                        <span>Total Rentals</span>
                        <strong>{orderSummary.totalRentals}</strong>
                      </article>
                      <article>
                        <span>Total Purchases</span>
                        <strong>{orderSummary.totalPurchases}</strong>
                      </article>
                      <article>
                        <span>Orders</span>
                        <strong>{customerOrders.length}</strong>
                      </article>
                      <article>
                        <span>Total Spent</span>
                        <strong>${orderSummary.totalSpent.toFixed(2)}</strong>
                      </article>
                    </div>

                    <div className="employee-customer-activity">
                      <h3>Order Activity</h3>
                      {customerOrders.length === 0 ? (
                        <p className="employee-empty">This customer has no order history yet.</p>
                      ) : (
                        <div className="employee-orders">
                          {customerOrders.map((order) => (
                            <article className="employee-order-card" key={order.id}>
                              <div className="employee-order-head">
                                <strong>Order #{order.id.slice(-6).toUpperCase()}</strong>
                                <span>${Number(order.totalAmount).toFixed(2)}</span>
                              </div>
                              <p>{new Date(order.createdAt).toLocaleString()}</p>
                              <ul>
                                {order.items.map((item) => (
                                  <li key={item.id}>
                                    {item.title} x{item.quantity} ({item.orderType.toLowerCase()})
                                  </li>
                                ))}
                              </ul>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </aside>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
