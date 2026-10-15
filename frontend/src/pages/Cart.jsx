import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import CartItem from "../components/CartItem";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";

function Cart() {
  const navigate = useNavigate();
  const { cartItems, loading, error, itemCount, subtotal, refreshCart } = useCart();

  const hasStockProblem = cartItems.some((item) => item.quantity > item.product.stock);

  return (
    <>
      <Navbar />

      <main className="products-page">
        <header className="products-header">
          <div>
            <p className="eyebrow">READY TO BUY</p>
            <h1>My Cart</h1>
          </div>
        </header>

        {loading && <p className="state-message">Loading your cart...</p>}

        {!loading && error && (
          <section className="state-panel">
            <h2>Unable to load your cart.</h2>
            <button type="button" className="primary-button" onClick={refreshCart}>
              Try Again
            </button>
          </section>
        )}

        {!loading && !error && cartItems.length === 0 && (
          <section className="state-panel">
            <p className="state-icon">🛒</p>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything yet.</p>
            <Link to="/products" className="primary-button">
              Browse Products
            </Link>
          </section>
        )}

        {!loading && !error && cartItems.length > 0 && (
          <div className="cart-layout">
            <section className="cart-list">
              {cartItems.map((item) => (
                <CartItem key={item.product._id} item={item} />
              ))}
            </section>

            <aside className="summary-card">
              <h2>Order Summary</h2>
              <div className="summary-row">
                <span>Items</span>
                <span>{itemCount}</span>
              </div>
              <div className="summary-row summary-total">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {hasStockProblem && (
                <p className="error-message">Some items exceed available stock. Update them to continue.</p>
              )}

              <button
                type="button"
                className="primary-button full-width"
                onClick={() => navigate("/checkout")}
                disabled={hasStockProblem}
              >
                Proceed to Checkout
              </button>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}

export default Cart;
