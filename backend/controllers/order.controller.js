const crypto = require("crypto");
const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const getRazorpay = require("../config/razorpay");
const { isMockMode, getKeyId, getKeySecret } = require("../config/razorpay");

const ADDRESS_FIELDS = ["fullName", "phone", "addressLine1", "city", "state", "pincode"];
const STATUS_FLOW = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

// Returns { address } with trimmed values, or { error } describing the first problem.
const validateShippingAddress = (input) => {
  if (!input || typeof input !== "object") {
    return { error: "Shipping address is required" };
  }

  const address = {};
  for (const field of ADDRESS_FIELDS) {
    const value = typeof input[field] === "string" ? input[field].trim() : "";
    if (!value) {
      return { error: `${field} is required` };
    }
    address[field] = value;
  }

  if (!/^[6-9]\d{9}$/.test(address.phone)) {
    return { error: "Phone must be a valid 10-digit mobile number" };
  }

  if (!/^\d{6}$/.test(address.pincode)) {
    return { error: "Pincode must contain 6 digits" };
  }

  return { address };
};

const createPaymentOrder = async (req, res) => {
  try {
    // Only the shipping address is read from the body. Items, prices and totals come from the database.
    const { address, error } = validateShippingAddress(req.body.shippingAddress);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const customer = await Customer.findById(req.user._id);
    if (customer.cart.length === 0) {
      return res.status(400).json({ success: false, message: "Your cart is empty" });
    }

    // Load the latest product data again: price or stock may have changed since items were added.
    const productIds = customer.cart.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productsById = new Map(products.map((product) => [product._id.toString(), product]));

    const items = [];
    let totalAmount = 0;

    for (const cartItem of customer.cart) {
      const product = productsById.get(cartItem.product.toString());

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "A product in your cart is no longer available. Please remove it and try again.",
        });
      }

      if (cartItem.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}.`,
        });
      }

      items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.image,
      });
      totalAmount += product.price * cartItem.quantity;
    }

    totalAmount = Math.round(totalAmount * 100) / 100;

    const razorpay = getRazorpay();

    const order = await Order.create({
      user: customer._id,
      items,
      shippingAddress: address,
      totalAmount,
    });

    try {
      // Razorpay expects the amount in paise.
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: order._id.toString(),
      });

      order.razorpayOrderId = razorpayOrder.id;
      await order.save();

      return res.status(201).json({
        success: true,
        shopKartOrderId: order._id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        // The Key ID is public. The Key Secret never leaves the server.
        key: getKeyId(),
        mock: isMockMode(),
      });
    } catch (razorpayError) {
      order.paymentStatus = "FAILED";
      await order.save();
      throw razorpayError;
    }
  } catch (error) {
    console.error("Create payment order failed:", error.message || error);
    return res.status(500).json({ success: false, message: "Unable to start payment. Please try again." });
  }
};

const signPayment = (razorpayOrderId, razorpayPaymentId) =>
  crypto
    .createHmac("sha256", getKeySecret())
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

const isValidSignature = (razorpayOrderId, razorpayPaymentId, signature) => {
  const expected = signPayment(razorpayOrderId, razorpayPaymentId);

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(String(signature));

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
};

const verifyPayment = async (req, res) => {
  try {
    const {
      shopKartOrderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body;

    if (!mongoose.isValidObjectId(shopKartOrderId) || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: "Payment details are incomplete" });
    }

    // Scoping by user means nobody can confirm someone else's order.
    const order = await Order.findOne({ _id: shopKartOrderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(200).json({ success: true, message: "Payment already verified", order });
    }

    // The signature is checked against the Razorpay order ID we stored, not the one the browser sent.
    if (
      !order.razorpayOrderId ||
      order.razorpayOrderId !== razorpayOrderId ||
      !isValidSignature(order.razorpayOrderId, razorpayPaymentId, razorpaySignature)
    ) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = razorpayPaymentId;
    await order.save();

    // The purchase is final, so reserve the stock that was bought.
    await Product.bulkWrite(
      order.items.map((item) => ({
        updateOne: {
          filter: { _id: item.product, stock: { $gte: item.quantity } },
          update: { $inc: { stock: -item.quantity } },
        },
      }))
    );

    // Clear the cart only now that payment is verified.
    await Customer.updateOne({ _id: req.user._id }, { $set: { cart: [] } });

    return res.status(200).json({ success: true, message: "Payment verified", order });
  } catch (error) {
    console.error("Verify payment failed:", error.message || error);
    return res.status(500).json({ success: false, message: "Unable to verify payment" });
  }
};

const markPaymentFailed = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    // Only a still-pending order can be marked failed; a verified payment is never downgraded.
    const order = await Order.findOneAndUpdate(
      { _id: id, user: req.user._id, paymentStatus: "PENDING" },
      { $set: { paymentStatus: "FAILED" } },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Pending order not found" });
    }

    return res.status(200).json({ success: true, message: "Payment marked as failed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to update order" });
  }
};

// Mock mode only: stands in for the Razorpay checkout popup. It returns the same three fields
// Razorpay hands the browser, signed correctly for "success" and with a bad signature for "fail".
const simulateMockPayment = async (req, res) => {
  try {
    if (!isMockMode()) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    const { id } = req.params;
    const outcome = req.body?.outcome === "fail" ? "fail" : "success";

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findOne({ _id: id, user: req.user._id });
    if (!order || !order.razorpayOrderId) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const razorpayPaymentId = `pay_mock_${crypto.randomBytes(7).toString("hex")}`;
    const razorpaySignature =
      outcome === "success"
        ? signPayment(order.razorpayOrderId, razorpayPaymentId)
        : crypto.randomBytes(32).toString("hex");

    return res.status(200).json({
      success: true,
      outcome,
      shopKartOrderId: order._id,
      razorpay_order_id: order.razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to simulate payment" });
  }
};

const getMyOrders = async (req, res) => {
  try {
    // My Orders lists real purchases only; abandoned or failed payment attempts are left out.
    const orders = await Order.find({ user: req.user._id, paymentStatus: "PAID" }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch orders" });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    // Another user's order ID returns 404, so its existence is not revealed.
    const order = await Order.findOne({ _id: id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch order" });
  }
};

// Bonus: development-only endpoint to move a paid order along PLACED → CONFIRMED → SHIPPED → DELIVERED.
const updateOrderStatus = async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findOne({ _id: id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.paymentStatus !== "PAID") {
      return res.status(400).json({ success: false, message: "Only paid orders can change status" });
    }

    const currentIndex = STATUS_FLOW.indexOf(order.status);
    // With no status given, advance one step.
    const nextStatus = status || STATUS_FLOW[currentIndex + 1];
    const nextIndex = STATUS_FLOW.indexOf(nextStatus);

    if (nextIndex === -1 || nextIndex <= currentIndex) {
      return res.status(400).json({
        success: false,
        message: `Status must move forward from ${order.status} to one of: ${STATUS_FLOW.slice(currentIndex + 1).join(", ") || "none"}`,
      });
    }

    order.status = nextStatus;
    await order.save();

    return res.status(200).json({ success: true, message: `Order is now ${nextStatus}`, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to update order status" });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  markPaymentFailed,
  simulateMockPayment,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
};
