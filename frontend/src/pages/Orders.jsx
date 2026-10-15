import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import OrderCard from "../components/OrderCard";
import api from "../services/api";

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get("/orders");
        setOrders(response.data.orders);
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

    fetchOrders();
  }, [navigate, reloadKey]);

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    setReloadKey((key) => key + 1);
  };

  return (
    <>
      <Navbar />

      <main className="products-page">
        <header className="products-header">
          <div>
            <p className="eyebrow">ORDER HISTORY</p>
            <h1>My Orders</h1>
          </div>
        </header>

        {loading && <p className="state-message">Loading your orders...</p>}

        {!loading && error && (
          <section className="state-panel">
            <h2>Something went wrong.</h2>
            <p>We couldn't load your orders.</p>
            <button type="button" className="primary-button" onClick={handleRetry}>
              Try Again
            </button>
          </section>
        )}

        {!loading && !error && orders.length === 0 && (
          <section className="state-panel">
            <p className="state-icon">📦</p>
            <h2>You have not placed any orders yet.</h2>
            <Link to="/products" className="primary-button">
              Start Shopping
            </Link>
          </section>
        )}

        {!loading && !error && orders.length > 0 && (
          <section className="orders-list">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </section>
        )}
      </main>
    </>
  );
}

export default Orders;
