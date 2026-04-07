// Shared navigation that changes links based on the signed-in role.
import "../styles/navbar.css";
import { NavLink, useNavigate } from "react-router-dom";
import { clearAuthSession, getHomeRoute, getStoredUser } from "../utils/auth";

export default function Navbar() {
    const navigate = useNavigate();
    const user = getStoredUser();
    const isOwnerView = user?.role === "OWNER";
    const isEmployeeView = user?.role === "EMPLOYEE";

    const getInitials = (currentUser) => {
        if (!currentUser) return "?";
        if (currentUser.name) {
            return currentUser.name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2);
        }
        return currentUser.email[0].toUpperCase();
    };

    const handleLogout = () => {
        clearAuthSession();
        navigate("/login");
    };

    const navClass = ({ isActive }) => `nav-item-link ${isActive ? "active" : ""}`;

    return (
        <nav className="navbar">
            <NavLink to={getHomeRoute(user?.role)} className="brand-link" aria-label="Video Shoppe home">
                <span className="brand-icon">VS</span>
                <span className="logo">Video Shoppe</span>
            </NavLink>

            <ul className="nav-links">
                {!isOwnerView && !isEmployeeView && <li><NavLink to="/home" className={navClass}>Home</NavLink></li>}
                <li><NavLink to="/catalog" className={navClass}>DVD Catalog</NavLink></li>
                {isEmployeeView && <li><NavLink to="/employee" className={navClass}>Employee</NavLink></li>}
                {isEmployeeView && <li><NavLink to="/inventory" className={navClass}>Inventory</NavLink></li>}
                {isEmployeeView && <li><NavLink to="/customer-activity" className={navClass}>Customer Activity</NavLink></li>}
                {isOwnerView && <li><NavLink to="/owner" className={navClass}>Owner</NavLink></li>}
                {isOwnerView && <li><NavLink to="/owner/stock" className={navClass}>DVDs In Stock</NavLink></li>}
                {isOwnerView && <li><NavLink to="/owner/inventory" className={navClass}>DVD Inventory</NavLink></li>}
                {isOwnerView && <li><NavLink to="/owner/employees" className={navClass}>Employee Accounts</NavLink></li>}
                {!isOwnerView && !isEmployeeView && <li><NavLink to="/alerts" className={navClass}>Rental Alerts</NavLink></li>}
                {!isOwnerView && !isEmployeeView && <li><NavLink to="/account" className={navClass}>Account</NavLink></li>}
                {!isOwnerView && !isEmployeeView && <li><NavLink to="/cart" className={navClass}>Cart</NavLink></li>}
            </ul>

            <div className="nav-user">
                {user && (
                    <>
                        <div className="user-avatar" title={user.name || user.email}>
                            {getInitials(user)}
                        </div>
                        <button className="logout-btn" onClick={handleLogout}>Log Out</button>
                    </>
                )}
            </div>
        </nav>
    );
}
