import { useState } from "react";
import { formatPrice } from "../utils/format";

// Stand-in for the Razorpay checkout popup when the backend runs without Razorpay keys.
function MockPaymentModal({ payment, onResult, onDismiss }) {
  const [busy, setBusy] = useState(false);

  const choose = async (outcome) => {
    setBusy(true);
    await onResult(outcome);
  };

  return (
    <div className="mock-pay-backdrop" role="dialog" aria-modal="true" aria-labelledby="mock-pay-title">
      <div className="mock-pay-card">
        <div className="mock-pay-header">
          <div>
            <p id="mock-pay-title" className="mock-pay-brand">ShopKart</p>
            <p className="mock-pay-sub">Razorpay (Mock Mode)</p>
          </div>
          <button type="button" className="mock-pay-close" onClick={onDismiss} disabled={busy} aria-label="Close">
            ×
          </button>
        </div>

        <p className="mock-pay-amount">{formatPrice(payment.amount / 100)}</p>
        <p className="mock-pay-order">Order: {payment.razorpayOrderId}</p>

        <p className="hint">
          No Razorpay account is configured, so this simulates the gateway. The signature check on the
          server is real.
        </p>

        <button type="button" className="primary-button full-width" onClick={() => choose("success")} disabled={busy}>
          {busy ? "Processing..." : "Simulate Successful Payment"}
        </button>
        <button type="button" className="mock-pay-fail full-width" onClick={() => choose("fail")} disabled={busy}>
          Simulate Failed Payment
        </button>
      </div>
    </div>
  );
}

export default MockPaymentModal;
