const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

const findCartItem = (customer, productId) =>
  customer.cart.find((item) => item.product.toString() === productId);

// Every cart response is the freshly populated cart, so the frontend always shows the latest price and stock.
const sendCart = async (res, customerId, message, status = 200) => {
  const customer = await Customer.findById(customerId).populate({
    path: "cart.product",
    select: "name price category image stock",
  });

  // Products deleted after being added populate as null, so leave them out.
  const cart = customer.cart.filter((item) => item.product);

  return res.status(status).json({ success: true, message, cart });
};

const getCart = async (req, res) => {
  try {
    return await sendCart(res, req.user._id, "Cart fetched");
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch cart" });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const customer = await Customer.findById(req.user._id);
    const existingItem = findCartItem(customer, productId);
    const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

    if (newQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message:
          product.stock === 0
            ? `${product.name} is out of stock`
            : `Only ${product.stock} units of ${product.name} are available`,
      });
    }

    if (existingItem) {
      existingItem.quantity = newQuantity;
    } else {
      customer.cart.push({ product: productId, quantity: 1 });
    }
    await customer.save();

    return await sendCart(res, customer._id, "Cart updated");
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to add product to cart" });
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    if (typeof quantity !== "number" || !Number.isInteger(quantity)) {
      return res.status(400).json({ success: false, message: "Quantity must be a whole number" });
    }

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const customer = await Customer.findById(req.user._id);
    const cartItem = findCartItem(customer, productId);
    if (!cartItem) {
      return res.status(404).json({ success: false, message: "Product not in cart" });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units of ${product.name} are available`,
      });
    }

    cartItem.quantity = quantity;
    await customer.save();

    return await sendCart(res, customer._id, "Cart updated");
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to update cart" });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const customer = await Customer.findById(req.user._id);
    if (!findCartItem(customer, productId)) {
      return res.status(404).json({ success: false, message: "Product not in cart" });
    }

    customer.cart = customer.cart.filter((item) => item.product.toString() !== productId);
    await customer.save();

    return await sendCart(res, customer._id, "Product removed from cart");
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to remove product from cart" });
  }
};

module.exports = { getCart, addToCart, updateCartQuantity, removeFromCart };
