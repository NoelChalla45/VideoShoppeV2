// Catalog page with search, filters, and paging.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/catalog.css';
import { apiFetchJson } from "../utils/api";
const CATEGORIES = ["New Releases", "Highest Rated", "Classics", "Family & Kids", "Action", "Comedy", "Mystery & Thriller", "Sci-Fi"];

export default function Catalog() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isBuyMode, setIsBuyMode] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [maxPrice, setMaxPrice] = useState(100);
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  // Load the inventory list when the page first opens.
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiFetchJson("/api/inventory", { errorMessage: "Failed to fetch inventory." });
        const sortedData = data.sort((a, b) => a.id - b.id);

        setProducts(sortedData);
      } catch (err) {
        console.error("Database error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const modeMax = isBuyMode ? 100 : 20;
    setMaxPrice((prev) => Math.min(Number(prev), modeMax));
    setCurrentPage(1);
  }, [isBuyMode]);

  const itemsPerPage = 6;

  // Apply all active filters before paging the results.
  const filteredProducts = products.filter((product) => {
    const currentPrice = isBuyMode ? product.price * 5 : product.price;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
    const matchesPrice = currentPrice <= maxPrice;
    const matchesStock = showInStockOnly ? product.stock > 0 : true;
    return matchesSearch && matchesCategory && matchesPrice && matchesStock;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const lastIndex = currentPage * itemsPerPage;
  const firstIndex = lastIndex - itemsPerPage;
  const currentItems = filteredProducts.slice(firstIndex, lastIndex);

  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((current) => current !== category) : [...prev, category]
    );
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCategories([]);
    setMaxPrice(isBuyMode ? 100 : 20);
    setShowInStockOnly(false);
    setCurrentPage(1);
  };

  return (
    <div className="catalog-layout">
      <aside className="filter-sidebar">
        <div className="sidebar-head">
          <h3>Filters</h3>
          <button type="button" className="clear-filters-btn" onClick={clearAllFilters}>Clear</button>
        </div>

        <div className="filter-section">
          <p className="filter-title">Availability</p>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showInStockOnly}
              onChange={() => {
                setShowInStockOnly(!showInStockOnly);
                setCurrentPage(1);
              }}
            />
            In Stock Only
          </label>
        </div>

        <div className="filter-section">
          <p className="filter-title">Categories</p>
          {CATEGORIES.map((cat) => (
            <label key={cat} className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => handleCategoryChange(cat)}
              />
              {cat}
            </label>
          ))}
        </div>

        <div className="filter-section">
          <p className="filter-title">Price Range</p>
          <input
            type="range"
            min="0"
            max={isBuyMode ? "100" : "20"}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
          <div className="price-labels">
            <span>$0</span>
            <span>${maxPrice}</span>
          </div>
        </div>
      </aside>

      <div className="catalog-container">
        <div className="catalog-head">
          <div>
            <p className="catalog-eyebrow">Movie Library</p>
            <h1>DVD Catalog</h1>
          </div>
          <div className="catalog-meta">
            <span>{filteredProducts.length} titles found</span>
            <span>{isBuyMode ? "Buy Mode" : "Rent Mode"}</span>
          </div>
        </div>

        <div className="search-controls">
          <input
            type="text"
            placeholder="Search DVDs..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          <div className="toggle-group">
            <span className={!isBuyMode ? "active-label" : ""}>Rent</span>
            <label className="switch">
              <input type="checkbox" checked={isBuyMode} onChange={() => setIsBuyMode(!isBuyMode)} />
              <span className="slider"></span>
            </label>
            <span className={isBuyMode ? "active-label" : ""}>Buy</span>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-grid">Loading movie collection...</div>
        ) : (
          <div className="product-grid">
            {currentItems.length > 0 ? (
              currentItems.map((product) => {
                const displayPrice = isBuyMode ? (product.price * 5).toFixed(2) : product.price.toFixed(2);
                const isOutOfStock = product.stock === 0;

                return (
                  <div key={product.id} className="product-card" onClick={() => navigate(`/catalog/${product.id}`)}>
                    <div className="image-box">
                      <img src={product.image} alt={product.name} style={{ opacity: isOutOfStock ? 0.5 : 1 }} />
                      <span className={`stock-badge ${isOutOfStock ? "out" : "in"}`}>
                        {isOutOfStock ? "Out" : `${product.stock} in stock`}
                      </span>
                    </div>
                    <h3>{product.name}</h3>
                    <p className="category-label">{product.category || "Featured"}</p>
                    <p className="price">${displayPrice} {!isBuyMode && <small>/day</small>}</p>
                  </div>
                );
              })
            ) : (
              <div className="no-results">No DVDs found for "{searchTerm}"</div>
            )}
          </div>
        )}

        <div className="pagination">
          <button className="nav-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)}>Prev</button>
          <span className="page-info">Page {currentPage} of {totalPages || 1}</span>
          <button className="nav-btn" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage((prev) => prev + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
