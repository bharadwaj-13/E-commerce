const express = require("express");
const {
  createPaymentOrder,
  verifyPayment,
  markPaymentFailed,
  simulateMockPayment,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} = require("../controllers/order.controller");
const protect = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(protect);

router.post("/create-payment-order", createPaymentOrder);
router.post("/verify-payment", verifyPayment);
router.get("/", getMyOrders);
router.get("/:id", getOrderById);
router.post("/:id/payment-failed", markPaymentFailed);
router.post("/:id/mock-pay", simulateMockPayment);
router.patch("/:id/status", updateOrderStatus);

module.exports = router;
