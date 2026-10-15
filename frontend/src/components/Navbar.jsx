import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import api from "../services/api";

// refreshKey lets a page ask the Navbar to re-fetch the wishlist count after it changes.
function Navbar({ refreshKey = 0 }) {
  const navigate = useNavigate();
  const [wishlistCount, setWishlistCount] = useState(null);
  // Cart count comes from the shared cart state, so it never needs its own fetch.
  const { itemCount, clearCart } = useCart();

  useEffect(() => {
    const fetchWishlistCount = async () => {
      try {
        const response = await api.get("/wishlist");
        setWishlistCount(response.data.count);
      } catch {
        setWishlistCount(null);
      }
    };

    fetchWishlistCount();
  }, [refreshKey]);

  const handleLogout = async () => {
    try {
      await api.post("/customers/logout");
    } finally {
      clearCart();
      navigate("/login");
    }
  };

  return (
    <nav className="navbar">
      <Link to="/products" className="brand">
        ShopKart
      </Link>

      <div className="nav-actions">
        <Link to="/home">Home</Link>
        <Link to="/products">Products</Link>
        <Link to="/wishlist">
          Wishlist{wishlistCount !== null && ` (${wishlistCount})`}
        </Link>
        <Link to="/cart">Cart ({itemCount})</Link>
        <Link to="/orders">Orders</Link>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
