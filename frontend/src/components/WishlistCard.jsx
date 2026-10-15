import { useState } from "react";
import { Link } from "react-router-dom";

function WishlistCard({ product, onRemove }) {
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  const handleRemove = async () => {
    if (removing) return;

    setRemoving(true);
    setError("");

    try {
      await onRemove(product._id);
    } catch {
      setError("Unable to remove product. Please try again.");
      setRemoving(false);
    }
  };

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
          className="wishlist-button saved"
          onClick={handleRemove}
          disabled={removing}
        >
          {removing ? "⏳ Removing..." : "Remove from Wishlist ♥"}
        </button>

        {error && <p className="error-message card-error">{error}</p>}
      </div>
    </article>
  );
}

export default WishlistCard;
