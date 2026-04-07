// Owner page for viewing employee account information.
import { useEffect, useState } from "react";
import "../styles/owner.css";
import { apiFetchJson } from "../utils/api";
import { getToken } from "../utils/auth";

export default function OwnerEmployees() {
  const token = getToken();
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetchJson("/api/auth/employees", {
          token,
          errorMessage: "Failed to load employees.",
        });
        setEmployees(data);
      } catch (err) {
        setError(err.message || "Failed to load employees.");
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, [token]);

  const openEmployeeDetail = async (employeeId) => {
    setError("");
    try {
      const data = await apiFetchJson(`/api/auth/employees/${employeeId}`, {
        token,
        errorMessage: "Failed to load employee details.",
      });
      setSelected(data);
    } catch (err) {
      setError(err.message || "Failed to load employee details.");
    }
  };

  return (
    <div className="owner-page">
      <div className="owner-inner">
        <header className="owner-head">
          <div>
            <p className="owner-eyebrow">Owner Console</p>
            <h1>Employee Accounts</h1>
          </div>
        </header>

        {error && <p className="owner-error">{error}</p>}

        <section className="owner-panel">
          {loading ? (
            <p className="owner-empty">Loading employee accounts...</p>
          ) : (
            <div className="owner-employees-layout">
              <div className="owner-list">
                {employees.map((employee) => (
                  <button
                    key={employee.id}
                    className="owner-employee-btn"
                    onClick={() => openEmployeeDetail(employee.id)}
                  >
                    <strong>{employee.name || "Unnamed Employee"}</strong>
                    <span>{employee.email}</span>
                  </button>
                ))}
              </div>

              <aside className="owner-detail">
                {!selected ? (
                  <p className="owner-empty">Click an employee to view details.</p>
                ) : (
                  <>
                    <h2>{selected.name || "Employee"}</h2>
                    <p><strong>Email:</strong> {selected.email}</p>
                    <p><strong>Role:</strong> {selected.role}</p>
                    <p><strong>Phone:</strong> {selected.phone || "N/A"}</p>
                    <p><strong>Address:</strong> {selected.address || "N/A"}</p>
                    <p><strong>Employment Type:</strong> {selected.employmentType || "N/A"}</p>
                    <p><strong>Status:</strong> {selected.isActive ? "Active" : "Inactive"}</p>
                    <p><strong>Created:</strong> {new Date(selected.createdAt).toLocaleString()}</p>
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
