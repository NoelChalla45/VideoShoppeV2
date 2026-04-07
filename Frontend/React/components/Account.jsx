// Customer account page with profile, rentals, and history.
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import "../styles/account.css";
import { apiFetchJson } from "../utils/api";
import { getStoredUser, getToken } from "../utils/auth";
import { getAccountActivityFromOrders } from "../utils/orders";

export default function Account() {
    const navigate = useNavigate();
    const user = getStoredUser();
    const userId = user?.id || "";
    const token = getToken();
    const [profile, setProfile] = useState(user);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user || !token) {
            setLoading(false);
            return;
        }

        const loadAccount = async () => {
            setLoading(true);
            setError("");

            try {
                const [meResponse, ordersResponse] = await Promise.all([
                    apiFetchJson("/api/auth/me", { token, errorMessage: "Failed to load profile." }),
                    apiFetchJson("/api/orders/mine", { token, errorMessage: "Failed to load order history." }),
                ]);

                setProfile(meResponse.user || user);
                setOrders(Array.isArray(ordersResponse) ? ordersResponse : []);
            } catch (err) {
                setError(err.message || "Failed to load account data.");
            } finally {
                setLoading(false);
            }
        };

        loadAccount();
    }, [token, userId]);

    const getInitials = (user) => {
        if (user.name) {
            return user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
        }
        return user.email[0].toUpperCase();
    };

    const accountActivity = useMemo(() => getAccountActivityFromOrders(orders), [orders]);
    const displayName = profile?.name || "Member";
    const memberSince = profile?.createdAt
        ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })
        : "Recently joined";
    const activeRentals = accountActivity.activeRentals || [];
    const history = accountActivity.history || [];
    const totalRented = history
        .filter((entry) => entry.mode === "rent")
        .reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);
    const overdueCount = activeRentals.filter((rental) => new Date(rental.dueDate) < new Date()).length;

    const formatDateTime = (dateValue) => {
        if (!dateValue) return "N/A";
        return new Date(dateValue).toLocaleString();
    };

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (loading) {
        return (
            <div className="account-page">
                <div className="account-inner">
                    <div className="empty-state">
                        <p>Loading your account...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="account-page">
            <div className="account-inner">
                <header className="account-head">
                    <div>
                        <p className="account-eyebrow">Account Hub</p>
                        <h1>Your Video Shoppe Profile</h1>
                    </div>
                    <div className="account-head-actions">
                        <button className="edit-btn" onClick={() => navigate("/catalog")}>Browse Catalog</button>
                        <button className="edit-btn alt" onClick={() => navigate("/alerts")}>Rental Alerts</button>
                    </div>
                </header>

                <div className="account-summary">
                    {/* Profile Card */}
                    <div className="profile-card">
                        <div className="profile-avatar">{getInitials(profile || user)}</div>
                        <div className="profile-info">
                            <h1 className="profile-name">{displayName}</h1>
                            <p className="profile-email">{profile?.email || user.email}</p>
                            <span className="member-badge">🎬 Member since {memberSince}</span>
                        </div>
                        <button className="edit-btn">Edit Profile</button>
                    </div>

                    {/* Stats Right Side */}
                    <div className="stats-row">
                        <div className="stat-card">
                            <span className="stat-num">{activeRentals.length}</span>
                            <span className="stat-label">ACTIVE RENTALS</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-num">{accountActivity.maxRentalsAllowed}</span>
                            <span className="stat-label">MAX RENTALS ALLOWED</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-num">{totalRented}</span>
                            <span className="stat-label">TOTAL RENTED</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-num">{overdueCount}</span>
                            <span className="stat-label">OVERDUE</span>
                        </div>
                    </div>
                </div>

                <div className="account-grid">
                    {/* Current Rentals */}
                    <section className="account-section">
                        <h2 className="section-heading">Current Rentals</h2>
                        {activeRentals.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">📀</span>
                                <p>No active rentals right now.</p>
                                <small>When you rent a title, its due date and pickup info will show here.</small>
                                <button className="browse-btn" onClick={() => navigate("/catalog")}>
                                    Browse Catalog
                                </button>
                            </div>
                        ) : (
                            <div className="account-list">
                                {activeRentals.slice(0, 6).map((rental) => (
                                    <article className="account-list-row" key={rental.rentalId}>
                                        <img src={rental.image || "/placeholder-dvd.png"} alt={rental.name} className="account-list-image" />
                                        <div className="account-list-content">
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

                    {/* Rental History */}
                    <section className="account-section">
                        <h2 className="section-heading">Rental History</h2>
                        {history.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">🎞️</span>
                                <p>No rental history yet.</p>
                                <small>Completed rentals will appear here for quick re-rents.</small>
                            </div>
                        ) : (
                            <div className="account-list">
                                {history.slice(0, 8).map((entry) => (
                                    <article className="account-list-row" key={entry.entryId}>
                                        <img src={entry.image || "/placeholder-dvd.png"} alt={entry.name} className="account-list-image" />
                                        <div className="account-list-content">
                                            <strong>{entry.name}</strong>
                                            <p>{entry.mode === "rent" ? "Rental" : "Purchase"} x{entry.quantity}</p>
                                            <p>{formatDateTime(entry.date)}</p>
                                            <p className="account-list-status">{entry.status}</p>
                                        </div>
                                        <div className="account-list-amount">
                                            ${Number(entry.totalPrice || 0).toFixed(2)}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {error && <p className="account-list-status">{error}</p>}

                {/* Account Settings */}
                <section className="account-section settings-section">
                    <h2 className="section-heading">Account Settings</h2>
                    <div className="settings-list">
                        <div className="settings-row">
                            <div>
                                <p className="settings-label">Email Address</p>
                                <p className="settings-value">{profile?.email || user.email}</p>
                            </div>
                            <button className="settings-btn">Change</button>
                        </div>
                        <div className="settings-row">
                            <div>
                                <p className="settings-label">Password</p>
                                <p className="settings-value">••••••••••••</p>
                            </div>
                            <button className="settings-btn">Change</button>
                        </div>
                        <div className="settings-row">
                            <div>
                                <p className="settings-label">Rental Alerts</p>
                                <p className="settings-value">Email notifications for due dates & availability</p>
                            </div>
                            <button className="settings-btn" onClick={() => navigate("/alerts")}>Manage</button>
                        </div>
                    </div>
                </section>

                <section className="account-section quick-actions-section">
                    <h2 className="section-heading">Quick Actions</h2>
                    <div className="quick-actions-grid">
                        <button className="quick-action-card" onClick={() => navigate("/catalog")}>
                            <span>🎬</span>
                            <strong>Find Something to Watch</strong>
                            <p>Browse the full movie catalog and reserve your next title.</p>
                        </button>
                        <button className="quick-action-card" onClick={() => navigate("/alerts")}>
                            <span>⏰</span>
                            <strong>Manage Rental Reminders</strong>
                            <p>Keep track of due dates and new release notifications.</p>
                        </button>
                    </div>
                </section>

            </div>
        </div>
    );
}
