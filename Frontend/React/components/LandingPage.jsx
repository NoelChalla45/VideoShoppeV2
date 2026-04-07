// Public landing page for the storefront.
import { Link } from "react-router-dom";
import "../styles/landing.css";
import { isAuthenticated } from "../utils/auth";

const FEATURED_STRIPS = [
  {
    title: "Friday Night Classics",
    description: "Curated shelves of all-time greats, remastered and ready.",
    tag: "Staff Pick",
  },
  {
    title: "New Release Radar",
    description: "Fresh arrivals weekly with first-look reservations.",
    tag: "Just In",
  },
  {
    title: "Collector's Vault",
    description: "Limited steelbooks and hard-to-find editions.",
    tag: "Limited",
  },
];

const GENRES = ["Action", "Horror", "Sci-Fi", "Comedy", "Anime", "Drama", "Thriller", "Family"];

export default function LandingPage() {
  const isLoggedIn = isAuthenticated();

  return (
    <div className="landing-page">
      <div className="landing-grain" aria-hidden="true"></div>

      <header className="landing-nav">
        <Link to="/" className="brand-mark" aria-label="Video Shoppe home">
          <span className="brand-icon">VS</span>
          <span className="brand-text">Video Shoppe</span>
        </Link>

        <div className="nav-actions">
          <Link to="/login" className="nav-link-btn">Login</Link>
          <Link to="/login" state={{ mode: "register" }} className="nav-cta-btn">Get Started</Link>
        </div>
      </header>

      <main>
        <section className="hero-stage">
          <p className="eyebrow">Your Neighborhood Movie Universe</p>
          <h1>Rewind the golden rental era, now with modern convenience.</h1>
          <p className="hero-copy">
            Discover cult classics, late-night thrillers, and new arrivals in one cinematic hub.
            Browse online, reserve instantly, and pick up like it is Friday night in 1999.
          </p>

          <div className="hero-actions">
            <Link to={isLoggedIn ? "/home" : "/login"} className="primary-action">
              {isLoggedIn ? "Enter My Library" : "Start Watching"}
            </Link>
            <Link to={isLoggedIn ? "/catalog" : "/catalog-preview"} className="secondary-action">
              Explore Catalog
            </Link>
          </div>

          <div className="spotlight-grid" aria-label="Feature highlights">
            {FEATURED_STRIPS.map((feature) => (
              <article className="spotlight-card" key={feature.title}>
                <span className="spotlight-tag">{feature.tag}</span>
                <h2>{feature.title}</h2>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="genre-wall" aria-label="Popular genres">
          <h2>Popular Shelves</h2>
          <p className="genre-copy">Quick-pick lanes for every kind of movie night.</p>
          <div className="genre-list">
            {GENRES.map((genre) => (
              <Link key={genre} to={`/catalog-preview?genre=${encodeURIComponent(genre)}`} className="genre-pill">
                <h3>{genre}</h3>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
