import { formatPrice } from "../utils/format";

// Shared by Checkout (live cart items) and order pages (purchase-time snapshot items).
function OrderSummary({ title = "Order Summary", items, total }) {
  return (
    <section className="summary-card">
      <h2>{title}</h2>

      {items.map((item) => (
        <div className="summary-row" key={item.id}>
          <span>
            {item.name} × {item.quantity}
          </span>
          <span>{formatPrice(item.price * item.quantity)}</span>
        </div>
      ))}

      <div className="summary-row summary-total">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
    </section>
  );
}

export default OrderSummary;
