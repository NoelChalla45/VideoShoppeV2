// Employee inventory page for browsing current stock.
import { useEffect, useState } from "react";
import "../styles/employee.css";
import { apiFetchJson } from "../utils/api";

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadInventory = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetchJson("/api/inventory", {
          errorMessage: "Failed to load inventory.",
        });
        setInventory(data);
      } catch (err) {
        setError(err.message || "Failed to load inventory.");
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, []);

  const filteredInventory = inventory.filter((dvd) => {
    const query = searchTerm.toLowerCase();
    return (
      dvd.name.toLowerCase().includes(query) ||
      (dvd.category || "").toLowerCase().includes(query)
    );
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredInventory.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="employee-page">
      <div className="employee-inner">
        <header className="employee-head">
          <div>
            <p className="employee-eyebrow">Employee Operations</p>
            <h1>Inventory</h1>
          </div>
        </header>

        {error && <p className="employee-error">{error}</p>}

        <section className="employee-panel">
          <h2>DVDs In Stock</h2>
          <div className="employee-search-wrap">
            <input
              type="text"
              className="employee-search-input"
              placeholder="Search by title or category..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          {loading ? (
            <p className="employee-empty">Loading inventory...</p>
          ) : (
            <>
              <div className="employee-table">
                {currentItems.map((dvd) => (
                  <article className="employee-row" key={dvd.id}>
                    <div>
                      <strong>{dvd.name}</strong>
                      <p>Category: {dvd.category}</p>
                      <p>Stock: {dvd.stock}</p>
                    </div>
                  </article>
                ))}
              </div>
              <div className="employee-pagination">
                <button
                  className="employee-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  Prev
                </button>
                <span className="employee-page-info">Page {currentPage} of {totalPages}</span>
                <button
                  className="employee-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
