import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import api from "../services/api";
import { getErrorMessage } from "../utils/format";

function ProductCard({ product, saved, onWishlistChange }) {
  const [saving, setSaving] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [error, setError] = useState("");
  const { cartItems, addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [cartError, setCartError] = useState("");

  const inCart = cartItems.some((item) => item.product._id === product._id);

  const handleAddToCart = async () => {
    if (adding) return;

    setAdding(true);
    setCartError("");

    try {
      await addToCart(product._id);
    } catch (error) {
      setCartError(
        error.response?.status === 401
          ? "Please log in to use your cart."
          : getErrorMessage(error, "Unable to add to cart. Please try again.")
      );
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 2000);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const handleWishlist = async () => {
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      if (saved) {
        await api.delete(`/wishlist/${product._id}`);
        onWishlistChange(product._id, false);
      } else {
        await api.post(`/wishlist/${product._id}`);
        setJustAdded(true);
        onWishlistChange(product._id, true);
      }
    } catch (error) {
      const status = error.response?.status;

      if (status === 409) {
        // Already saved (e.g. from another tab), so reflect the backend's truth.
        onWishlistChange(product._id, true);
      } else if (status === 401) {
        setError("Please log in to use your wishlist.");
      } else {
        setError(
          saved
            ? "Unable to remove product. Please try again."
            : "Unable to save product. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  let wishlistLabel = "♡ Add to Wishlist";
  if (saving) wishlistLabel = "⏳ Saving...";
  else if (saved && justAdded) wishlistLabel = "♥ Added to Wishlist";
  else if (saved) wishlistLabel = "♥ Remove from Wishlist";

  return (
    <article className="product-card">
      <img src={product.image} alt={product.name} />

      <div className="product-card-content">
        <p className="category">{product.category}</p>
        <h3>{product.name}</h3>
        <p className="price">
          ₹{product.price.toLocaleString("en-IN")}
        </p>
        <p className={product.stock > 0 ? "in-stock" : "out-of-stock"}>
          {product.stock > 0
            ? `${product.stock} units left`
            : "Out of stock"}
        </p>

        <Link to={`/products/${product._id}`} className="details-link">
          View Details
        </Link>

        <button
          type="button"
          className="cart-button"
          onClick={handleAddToCart}
          disabled={adding || product.stock === 0}
        >
          {adding
            ? "Adding..."
            : product.stock === 0
              ? "Out of Stock"
              : inCart
                ? "Add Another"
                : "Add to Cart"}
        </button>

        {cartError && <p className="error-message card-error">{cartError}</p>}

        <button
          type="button"
          className={saved ? "wishlist-button saved" : "wishlist-button"}
          onClick={handleWishlist}
          disabled={saving}
        >
          {wishlistLabel}
        </button>

        {error && <p className="error-message card-error">{error}</p>}
      </div>
    </article>
  );
}

export default ProductCard;
