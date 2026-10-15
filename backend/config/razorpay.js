const crypto = require("crypto");
const Razorpay = require("razorpay");

let razorpay;

// Without real keys (and outside production) we fall back to a mock gateway so the
// payment flow can be demonstrated end to end. Signature checks still run for real.
const isMockMode = () =>
  process.env.NODE_ENV !== "production" &&
  (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET);

const MOCK_KEY_ID = "rzp_mock_key";
const MOCK_KEY_SECRET = "rzp_mock_secret";

const getKeyId = () => (isMockMode() ? MOCK_KEY_ID : process.env.RAZORPAY_KEY_ID);
const getKeySecret = () => (isMockMode() ? MOCK_KEY_SECRET : process.env.RAZORPAY_KEY_SECRET);

// Mimics the shape of razorpay.orders.create() so the controller code is unchanged.
const mockRazorpay = {
  orders: {
    create: async ({ amount, currency, receipt }) => {
      if (!Number.isInteger(amount) || amount < 100) {
        const error = new Error("Order amount less than minimum amount allowed");
        error.statusCode = 400;
        throw error;
      }

      return {
        id: `order_mock_${crypto.randomBytes(7).toString("hex")}`,
        entity: "order",
        amount,
        currency,
        receipt,
        status: "created",
      };
    },
  },
};

// Created lazily so the rest of the API still starts if the Razorpay keys are not configured yet.
const getRazorpay = () => {
  if (isMockMode()) {
    return mockRazorpay;
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env");
  }

  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  return razorpay;
};

module.exports = getRazorpay;
module.exports.isMockMode = isMockMode;
module.exports.getKeyId = getKeyId;
module.exports.getKeySecret = getKeySecret;
