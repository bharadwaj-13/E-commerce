import { Link } from "react-router-dom";
import OrderStatus from "./OrderStatus";
import { formatDate, formatPrice } from "../utils/format";

function OrderCard({ order }) {
  return (
    <article className="order-card">
      <header className="order-card-header">
        <div>
          <h3>Order #{order._id.slice(-8).toUpperCase()}</h3>
          <p className="muted">{formatDate(order.createdAt)}</p>
        </div>
        <p className="price">{formatPrice(order.totalAmount)}</p>
      </header>

      <ul className="order-items">
        {order.items.map((item) => (
          <li key={item.product}>
            {item.name} × {item.quantity}
          </li>
        ))}
      </ul>

      <OrderStatus status={order.status} />

      <Link to={`/orders/${order._id}`} className="details-link">
        View Details
      </Link>
    </article>
  );
}

export default OrderCard;
