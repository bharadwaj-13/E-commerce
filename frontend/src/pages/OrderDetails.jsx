import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import OrderStatus from "../components/OrderStatus";
import OrderSummary from "../components/OrderSummary";
import api from "../services/api";
import { formatDate } from "../utils/format";

// Serves both /orders/:id and /order-success/:id; `success` adds the confirmation banner.
function OrderDetails({ success = false }) {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/${id}`);
        setOrder(response.data.order);
      } catch {
        setError("We couldn't find this order.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  return (
    <>
      <Navbar />

      <main className="products-page">
        {loading && <p className="state-message">Loading order...</p>}

        {!loading && error && (
          <section className="state-panel">
            <h2>{error}</h2>
            <Link to="/orders" className="primary-button">
              View My Orders
            </Link>
          </section>
        )}

        {!loading && order && (
          <section className="order-details">
            {success && order.paymentStatus === "PAID" && (
              <div className="success-banner">
                <p className="state-icon">✅</p>
                <h1>Order Placed Successfully</h1>
                <p>Your order has been saved successfully.</p>
              </div>
            )}

            {!success && <h1>Order Details</h1>}

            <div className="order-meta">
              <p>
                <strong>Order ID:</strong> {order._id}
              </p>
              <p>
                <strong>Placed on:</strong> {formatDate(order.createdAt)}
              </p>
              <p>
                <strong>Payment:</strong> {order.paymentStatus}
              </p>
              <div>
                <strong>Status:</strong>
                <OrderStatus status={order.status} />
              </div>
            </div>

            <OrderSummary
              title="Items"
              items={order.items.map((item) => ({
                id: item.product,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
              }))}
              total={order.totalAmount}
            />

            <div className="summary-card">
              <h2>Shipping To</h2>
              <p>
                {order.shippingAddress.fullName}
                <br />
                {order.shippingAddress.addressLine1}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                <br />
                {order.shippingAddress.phone}
              </p>
            </div>

            <div className="button-row">
              <Link to="/orders" className="primary-button">
                View My Orders
              </Link>
              <Link to="/products" className="secondary-button">
                Continue Shopping
              </Link>
            </div>
          </section>
        )}
      </main>
    </>
  );
}

export default OrderDetails;
