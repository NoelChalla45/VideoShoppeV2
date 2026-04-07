// Owner dashboard with quick links to admin pages.
import { useNavigate } from "react-router-dom";
import "../styles/owner.css";
import { getStoredUser } from "../utils/auth";

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();

  return (
    <div className="owner-page">
      <div className="owner-inner">
        <header className="owner-head">
          <div>
            <p className="owner-eyebrow">Owner Console</p>
            <h1>Owner Account</h1>
          </div>
        </header>

        <section className="owner-panel">
          <h2>Account Details</h2>
          <div className="owner-account-grid">
            <article>
              <span>Name</span>
              <strong>{user?.name || "N/A"}</strong>
            </article>
            <article>
              <span>Email</span>
              <strong>{user?.email || "N/A"}</strong>
            </article>
            <article>
              <span>Role</span>
              <strong>{user?.role || "OWNER"}</strong>
            </article>
          </div>
        </section>

        <section className="owner-panel">
          <h2>Owner Tools</h2>
          <div className="owner-tool-grid">
            <button onClick={() => navigate("/owner/stock")}>DVDs In Stock</button>
            <button onClick={() => navigate("/owner/inventory")}>DVD Inventory</button>
            <button onClick={() => navigate("/owner/employees")}>Employee Accounts</button>
          </div>
        </section>
      </div>
    </div>
  );
}
