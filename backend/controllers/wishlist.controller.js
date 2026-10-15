const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

const isInWishlist = (customer, productId) =>
  customer.wishlist.some((id) => id.toString() === productId);

const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.exists({ _id: productId });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // The user always comes from the auth middleware, never from the request body.
    const customer = await Customer.findById(req.user._id);
    if (isInWishlist(customer, productId)) {
      return res.status(409).json({ success: false, message: "Product already in wishlist" });
    }

    customer.wishlist.push(productId);
    await customer.save();

    return res.status(201).json({ success: true, message: "Product added to wishlist" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to add product to wishlist" });
  }
};

const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: "wishlist",
      select: "name price category image stock",
    });

    // populate() returns null for products deleted after they were saved, so skip those.
    const wishlist = customer.wishlist.filter(Boolean);

    return res.status(200).json({
      success: true,
      count: wishlist.length,
      wishlist,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch wishlist" });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const customer = await Customer.findById(req.user._id);
    if (!isInWishlist(customer, productId)) {
      return res.status(404).json({ success: false, message: "Product not in wishlist" });
    }

    customer.wishlist.pull(productId);
    await customer.save();

    return res.status(200).json({ success: true, message: "Product removed from wishlist" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to remove product from wishlist" });
  }
};

const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const customer = await Customer.findById(req.user._id);

    if (isInWishlist(customer, productId)) {
      customer.wishlist.pull(productId);
      await customer.save();
      return res.status(200).json({ success: true, saved: false, message: "Product removed from wishlist" });
    }

    const product = await Product.exists({ _id: productId });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    customer.wishlist.push(productId);
    await customer.save();
    return res.status(200).json({ success: true, saved: true, message: "Product added to wishlist" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to update wishlist" });
  }
};

module.exports = { addToWishlist, getWishlist, removeFromWishlist, toggleWishlist };
