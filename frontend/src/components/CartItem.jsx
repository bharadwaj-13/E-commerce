import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatPrice, getErrorMessage } from "../utils/format";

function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();
  // Loading is tracked per item, so changing one row doesn't lock the whole cart.
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const { product, quantity } = item;

  const runAction = async (action, fallbackMessage) => {
    if (updating) return;

    setUpdating(true);
    setError("");

    try {
      await action();
    } catch (error) {
      setError(getErrorMessage(error, fallbackMessage));
    } finally {
      setUpdating(false);
    }
  };

  const handleDecrease = () =>
    runAction(() => updateQuantity(product._id, quantity - 1), "Unable to update quantity.");

  const handleIncrease = () =>
    runAction(() => updateQuantity(product._id, quantity + 1), "Unable to update quantity.");

  const handleRemove = () =>
    runAction(() => removeFromCart(product._id), "Unable to remove item.");

  return (
    <article className="cart-item">
      <img src={product.image} alt={product.name} />

      <div className="cart-item-info">
        <p className="category">{product.category}</p>
        <Link to={`/products/${product._id}`} className="cart-item-name">
          {product.name}
        </Link>
        <p>{formatPrice(product.price)} each</p>
        <p className={quantity >= product.stock ? "out-of-stock" : "in-stock"}>
          {quantity > product.stock
            ? `Only ${product.stock} left. Please reduce the quantity.`
            : `${product.stock} units in stock`}
        </p>

        <div className="cart-item-actions">
          <div className="quantity-control">
            <button
              type="button"
              onClick={handleDecrease}
              disabled={updating || quantity <= 1}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span>{updating ? "…" : quantity}</span>
            <button
              type="button"
              onClick={handleIncrease}
              disabled={updating || quantity >= product.stock}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button type="button" className="text-button" onClick={handleRemove} disabled={updating}>
            Remove
          </button>
        </div>

        {error && <p className="error-message card-error">{error}</p>}
      </div>

      <p className="cart-item-total">{formatPrice(product.price * quantity)}</p>
    </article>
  );
}

export default CartItem;
