import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import WishlistCard from "../components/WishlistCard";
import api from "../services/api";

function Wishlist() {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [navbarRefreshKey, setNavbarRefreshKey] = useState(0);

  // Bumping this re-runs the fetch effect (used by "Try Again").
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await api.get("/wishlist");
        setWishlist(response.data.wishlist);
      } catch (error) {
        if (error.response?.status === 401) {
          navigate("/login");
          return;
        }
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [navigate, reloadKey]);

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    setReloadKey((key) => key + 1);
  };

  // Throws on failure so the card can show its own error message.
  const handleRemove = async (productId) => {
    await api.delete(`/wishlist/${productId}`);
    setWishlist((current) => current.filter((product) => product._id !== productId));
    setNavbarRefreshKey((key) => key + 1);
  };

  return (
    <>
      <Navbar refreshKey={navbarRefreshKey} />

      <main className="products-page">
        <header className="products-header">
          <div>
            <p className="eyebrow">SAVED FOR LATER</p>
            <h1>My Wishlist</h1>
            {!loading && !error && (
              <p>
                {wishlist.length} {wishlist.length === 1 ? "product" : "products"} saved
              </p>
            )}
          </div>
        </header>

        {loading && <p className="state-message">Loading your wishlist...</p>}

        {!loading && error && (
          <section className="state-panel">
            <h2>Something went wrong.</h2>
            <p>We couldn't load your wishlist.</p>
            <button type="button" className="primary-button" onClick={handleRetry}>
              Try Again
            </button>
          </section>
        )}

        {!loading && !error && wishlist.length === 0 && (
          <section className="state-panel">
            <p className="state-icon">❤️</p>
            <h2>Your wishlist is empty</h2>
            <p>Save products you love and find them here later.</p>
            <Link to="/products" className="primary-button">
              Browse Products
            </Link>
          </section>
        )}

        {!loading && !error && wishlist.length > 0 && (
          <section className="products-grid">
            {wishlist.map((product) => (
              <WishlistCard key={product._id} product={product} onRemove={handleRemove} />
            ))}
          </section>
        )}
      </main>
    </>
  );
}

export default Wishlist;
