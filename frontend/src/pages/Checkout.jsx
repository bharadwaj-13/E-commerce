import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import CheckoutForm from "../components/CheckoutForm";
import MockPaymentModal from "../components/MockPaymentModal";
import OrderSummary from "../components/OrderSummary";
import { useCart } from "../context/CartContext";
import api from "../services/api";
import { getErrorMessage } from "../utils/format";
import { validateShipping } from "../utils/validation";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

function Checkout() {
  const navigate = useNavigate();
  const { cartItems, loading, subtotal, clearCart } = useCart();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [mockPayment, setMockPayment] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  };

  const verifyPayment = async (shopKartOrderId, response) => {
    try {
      await api.post("/orders/verify-payment", {
        shopKartOrderId,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });

      // The backend cleared the cart after verification; mirror that in global state.
      clearCart();
      navigate(`/order-success/${shopKartOrderId}`, { replace: true });
    } catch (error) {
      setError(getErrorMessage(error, "We couldn't verify your payment. Your cart has not been cleared."));
      setPlacing(false);
    }
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    if (placing) return;

    setError("");
    const errors = validateShipping(form);
    setFieldErrors(errors);
    // Don't call the backend if basic validation fails.
    if (Object.keys(errors).length > 0) return;

    setPlacing(true);

    const shippingAddress = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()])
    );

    let data;
    try {
      // Only the address is sent. The server works out items, prices and the total itself.
      const response = await api.post("/orders/create-payment-order", { shippingAddress });
      data = response.data;
    } catch (error) {
      setError(getErrorMessage(error, "Unable to place your order. Please try again."));
      setPlacing(false);
      return;
    }

    // No Razorpay account configured: the backend runs a mock gateway, so show our own popup.
    if (data.mock) {
      setMockPayment(data);
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setError("Unable to load the payment gateway. Check your connection and try again.");
      setPlacing(false);
      return;
    }

    const paymentObject = new window.Razorpay({
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: "ShopKart",
      description: "ShopKart Order",
      order_id: data.razorpayOrderId,
      // Razorpay's success callback is not proof of payment; the backend verifies the signature.
      handler: (response) => verifyPayment(data.shopKartOrderId, response),
      prefill: {
        name: shippingAddress.fullName,
        contact: shippingAddress.phone,
      },
      theme: { color: "#2563eb" },
      modal: {
        ondismiss: () => {
          setError("Payment was cancelled. Your cart has not been cleared.");
          setPlacing(false);
        },
      },
    });

    paymentObject.on("payment.failed", () => {
      api.post(`/orders/${data.shopKartOrderId}/payment-failed`).catch(() => {});
      setError("Payment failed. Your cart has not been cleared. Please try again.");
    });

    paymentObject.open();
  };

  const handleMockResult = async (outcome) => {
    const { shopKartOrderId } = mockPayment;
    try {
      const { data: payment } = await api.post(`/orders/${shopKartOrderId}/mock-pay`, { outcome });
      setMockPayment(null);
      if (outcome === "success") {
        await verifyPayment(shopKartOrderId, payment);
        return;
      }

      // A failed payment still goes through verification so the server rejects the bad signature.
      try {
        await api.post("/orders/verify-payment", { shopKartOrderId, ...payment });
      } catch {
        // Expected: 400 Invalid payment signature.
      }
      api.post(`/orders/${shopKartOrderId}/payment-failed`).catch(() => {});
      setError("Payment failed. Your cart has not been cleared. Please try again.");
    } catch (error) {
      setMockPayment(null);
      setError(getErrorMessage(error, "Unable to process the payment. Please try again."));
    }
    setPlacing(false);
  };

  const handleMockDismiss = () => {
    setMockPayment(null);
    setError("Payment was cancelled. Your cart has not been cleared.");
    setPlacing(false);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <p className="state-message">Loading checkout...</p>
      </>
    );
  }

  // Someone opening /checkout directly with an empty cart has nothing to pay for.
  if (cartItems.length === 0) {
    return (
      <>
        <Navbar />
        <main className="products-page">
          <section className="state-panel">
            <p className="state-icon">🛒</p>
            <h2>Your cart is empty</h2>
            <p>Add some products before checking out.</p>
            <Link to="/products" className="primary-button">
              Browse Products
            </Link>
          </section>
        </main>
      </>
    );
  }

  const summaryItems = cartItems.map((item) => ({
    id: item.product._id,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
  }));

  return (
    <>
      <Navbar />

      <main className="products-page">
        <header className="products-header">
          <div>
            <p className="eyebrow">ALMOST THERE</p>
            <h1>Checkout</h1>
          </div>
        </header>

        <form className="cart-layout" onSubmit={handlePlaceOrder} noValidate>
          <CheckoutForm form={form} errors={fieldErrors} onChange={handleChange} disabled={placing} />

          <div>
            <OrderSummary items={summaryItems} total={subtotal} />

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="primary-button full-width" disabled={placing}>
              {placing ? "Processing payment..." : "Pay with Razorpay"}
            </button>

            <p className="hint">Test Mode: no real money is charged.</p>
          </div>
        </form>
      </main>

      {mockPayment && (
        <MockPaymentModal payment={mockPayment} onResult={handleMockResult} onDismiss={handleMockDismiss} />
      )}
    </>
  );
}

export default Checkout;
