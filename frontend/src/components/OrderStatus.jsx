const STEPS = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

// Bonus: shows how far a paid order has progressed.
function OrderStatus({ status }) {
  const currentIndex = STEPS.indexOf(status);

  if (currentIndex === -1) {
    return <span className="status-badge pending">{status.replace("_", " ")}</span>;
  }

  return (
    <ol className="status-tracker">
      {STEPS.map((step, index) => (
        <li key={step} className={index <= currentIndex ? "done" : ""}>
          {step}
        </li>
      ))}
    </ol>
  );
}

export default OrderStatus;
