// Public preview of the catalog shown before login.
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../styles/catalog-preview.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const GENRES = ["Action", "Horror", "Sci-Fi", "Comedy", "Anime", "Drama", "Thriller", "Family"];
const MOVIES_PER_PAGE = 10;
const GENRE_CATEGORY_MAP = {
  Action: ["Action"],
  Horror: ["Horror", "Mystery & Thriller"],
  "Sci-Fi": ["Sci-Fi"],
  Comedy: ["Comedy"],
  Anime: ["Anime", "Classics", "Family & Kids"],
  Drama: ["Drama", "Classics", "Highest Rated"],
  Thriller: ["Thriller", "Mystery & Thriller"],
  Family: ["Family", "Family & Kids"],
};

export default function CatalogPreview() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const selectedGenre = searchParams.get("genre") || "All";

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const response = await fetch(`${API}/api/inventory`);
        if (!response.ok) throw new Error("Failed to fetch preview movies");

        const data = await response.json();
        setMovies(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Preview load error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreview();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGenre]);

  const filteredMovies = useMemo(() => {
    const sortedMovies = [...movies].sort((a, b) => b.stock - a.stock);
    if (selectedGenre === "All") return sortedMovies;

    const targetCategories = GENRE_CATEGORY_MAP[selectedGenre] || [selectedGenre];

    return sortedMovies.filter((movie) => {
      const category = String(movie.category || "").toLowerCase();
      return targetCategories.some((target) => category.includes(target.toLowerCase()));
    });
  }, [movies, selectedGenre]);

  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / MOVIES_PER_PAGE));
  const firstIndex = (currentPage - 1) * MOVIES_PER_PAGE;
  const visibleMovies = filteredMovies.slice(firstIndex, firstIndex + MOVIES_PER_PAGE);

  const chooseGenre = (genre) => {
    if (genre === "All") {
      setSearchParams({});
      return;
    }
    setSearchParams({ genre });
  };

  return (
    <div className="catalog-preview-page">
      <div className="preview-overlay" aria-hidden="true" />

      <main className="catalog-preview-shell">
        <Link to="/" className="preview-back-link">Back to Home</Link>

        <header className="preview-header">
          <p className="preview-eyebrow">Browse Catalog</p>
          <h1>Explore movies.</h1>
          <p>
            Pick a shelf and browse the available movies. Sign in when you are ready for full details and checkout.
          </p>
          <div className="preview-actions">
            <Link to="/login" className="preview-primary">Log In</Link>
            <Link to="/login" state={{ mode: "register" }} className="preview-secondary">Create Account</Link>
          </div>

          <div className="preview-genre-row" aria-label="Genre filters">
            <button
              type="button"
              className={`preview-genre-btn ${selectedGenre === "All" ? "active" : ""}`}
              onClick={() => chooseGenre("All")}
            >
              All
            </button>
            {GENRES.map((genre) => (
              <button
                key={genre}
                type="button"
                className={`preview-genre-btn ${selectedGenre === genre ? "active" : ""}`}
                onClick={() => chooseGenre(genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </header>

        {isLoading ? (
          <section className="preview-loading">Loading movie preview...</section>
        ) : (
          <>
            <section className="preview-grid" aria-label="Movie preview list">
              {visibleMovies.length > 0 ? (
                visibleMovies.map((movie) => (
                  <article className="preview-card" key={movie.id}>
                    <div className="preview-poster-wrap">
                      <img src={movie.image} alt={movie.name} className="preview-poster" />
                    </div>
                    <h2>{movie.name}</h2>
                    <p className="preview-meta">{movie.category || "Featured"}</p>
                    <p className="preview-price">From ${Number(movie.price || 0).toFixed(2)}/day</p>
                  </article>
                ))
              ) : (
                <div className="preview-empty">
                  No movies found for <strong>{selectedGenre}</strong>.
                </div>
              )}
            </section>

            <div className="preview-pagination">
              <button
                type="button"
                className="preview-page-btn"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Back
              </button>
              <span className="preview-page-info">Page {currentPage} of {totalPages}</span>
              <button
                type="button"
                className="preview-page-btn"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
