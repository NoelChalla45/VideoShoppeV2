// Customer rental alerts page for due-soon and overdue items.
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import "../styles/alerts.css";
import { apiFetchJson } from "../utils/api";
import { getStoredUser, getToken } from "../utils/auth";
import { getAccountActivityFromOrders } from "../utils/orders";

const DUE_SOON_HOURS = 24;

function formatDateTime(dateValue) {
  if (!dateValue) return "N/A";
  return new Date(dateValue).toLocaleString();
}

function getHoursUntil(dateValue) {
  return (new Date(dateValue).getTime() - Date.now()) / (1000 * 60 * 60);
}

export default function RentalAlerts() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const userId = user?.id || "";
  const token = getToken();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !token) {
      setLoading(false);
      return;
    }

    const loadOrders = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await apiFetchJson("/api/orders/mine", {
          token,
          errorMessage: "Failed to load rental alerts.",
        });
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to load rental alerts.");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [token, userId]);

  const { dueSoonRentals, overdueRentals } = useMemo(() => {
    const accountActivity = getAccountActivityFromOrders(orders);
    const activeRentals = accountActivity.activeRentals || [];

    return activeRentals.reduce(
      (acc, rental) => {
        const hoursUntilDue = getHoursUntil(rental.dueDate);

        if (hoursUntilDue < 0) {
          acc.overdueRentals.push(rental);
        } else if (hoursUntilDue <= DUE_SOON_HOURS) {
          acc.dueSoonRentals.push(rental);
        }

        return acc;
      },
      { dueSoonRentals: [], overdueRentals: [] }
    );
  }, [orders]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="alerts-page">
        <div className="alerts-inner">
          <div className="alerts-empty-state">
            <p>Loading rental alerts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts-page">
      <div className="alerts-inner">
        <header className="alerts-head">
          <div>
            <p className="alerts-eyebrow">Customer Alerts</p>
            <h1>Rental Alerts</h1>
          </div>
          <div className="alerts-head-actions">
            <button className="alerts-btn" onClick={() => navigate("/account")}>Back to Account</button>
            <button className="alerts-btn alerts-btn-primary" onClick={() => navigate("/catalog")}>Browse Catalog</button>
          </div>
        </header>

        {error && <p className="alerts-error">{error}</p>}

        <div className="alerts-summary">
          <article className="alerts-stat-card">
            <span className="alerts-stat-num">{dueSoonRentals.length}</span>
            <span className="alerts-stat-label">DUE SOON</span>
          </article>
          <article className="alerts-stat-card alerts-stat-card-warning">
            <span className="alerts-stat-num">{overdueRentals.length}</span>
            <span className="alerts-stat-label">OVERDUE</span>
          </article>
        </div>

        <div className="alerts-grid">
          <section className="alerts-section">
            <h2>Due Soon</h2>
            <p className="alerts-helper">Rentals due within the next {DUE_SOON_HOURS} hours.</p>
            {dueSoonRentals.length === 0 ? (
              <div className="alerts-empty-state">
                <p>No rentals are close to their due date right now.</p>
              </div>
            ) : (
              <div className="alerts-list">
                {dueSoonRentals.map((rental) => (
                  <article className="alerts-card" key={rental.rentalId}>
                    <img src={rental.image} alt={rental.name} className="alerts-card-image" />
                    <div className="alerts-card-content">
                      <strong>{rental.name}</strong>
                      <p>Qty: {rental.quantity}</p>
                      <p>Rented: {formatDateTime(rental.rentedAt)}</p>
                      <p>Due: {formatDateTime(rental.dueDate)}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="alerts-section alerts-section-overdue">
            <h2>Overdue</h2>
            <p className="alerts-helper">Rentals that have already passed their due date.</p>
            {overdueRentals.length === 0 ? (
              <div className="alerts-empty-state">
                <p>No overdue rentals right now.</p>
              </div>
            ) : (
              <div className="alerts-list">
                {overdueRentals.map((rental) => (
                  <article className="alerts-card alerts-card-overdue" key={rental.rentalId}>
                    <img src={rental.image} alt={rental.name} className="alerts-card-image" />
                    <div className="alerts-card-content">
                      <strong>{rental.name}</strong>
                      <p>Qty: {rental.quantity}</p>
                      <p>Rented: {formatDateTime(rental.rentedAt)}</p>
                      <p>Due: {formatDateTime(rental.dueDate)}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
