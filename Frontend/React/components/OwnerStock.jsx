// Owner stock page focused on counts and availability.
import { useEffect, useMemo, useState } from "react";
import "../styles/owner.css";
import { apiFetchJson } from "../utils/api";

export default function OwnerStock() {
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
          errorMessage: "Failed to load stock.",
        });
        setInventory(data);
      } catch (err) {
        setError(err.message || "Failed to load stock.");
      } finally {
        setLoading(false);
      }
    };
    loadInventory();
  }, []);

  const filteredStockView = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return inventory.filter((item) => item.name.toLowerCase().includes(q) || (item.category || "").toLowerCase().includes(q));
  }, [inventory, searchTerm]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredStockView.length / itemsPerPage) || 1;
  const pageItems = filteredStockView.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="owner-page">
      <div className="owner-inner">
        <header className="owner-head">
          <div>
            <p className="owner-eyebrow">Owner Console</p>
            <h1>DVDs In Stock</h1>
          </div>
        </header>

        {error && <p className="owner-error">{error}</p>}

        <section className="owner-panel">
          <h2>Storefront DVD Stock (Read Only)</h2>
          <p className="owner-helper-text">
            This page mirrors what employees and customers see.
            Stock updates are owner-only and handled in the DVD Inventory page.
          </p>
          <input
            className="owner-search"
            type="text"
            placeholder="Search by title or category..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />

          {loading ? (
            <p className="owner-empty">Loading stock...</p>
          ) : (
            <>
              <div className="owner-list">
                {pageItems.map((dvd) => (
                  <article className="owner-list-row" key={dvd.id}>
                    <strong>{dvd.name}</strong>
                    <span>{dvd.category}</span>
                    <span>Stock: {dvd.stock}</span>
                  </article>
                ))}
              </div>
              <div className="owner-pagination">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)}>Prev</button>
                <span>Page {currentPage} of {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => prev + 1)}>Next</button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
