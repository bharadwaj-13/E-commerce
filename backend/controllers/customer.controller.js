const Customer = require("../models/customer.model");
const generateToken = require("../utils/generateToken");

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (![fullName, email, password, phone].every((field) => field && field.trim())) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must contain at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingCustomer = await Customer.findOne({ email: normalizedEmail });
    if (existingCustomer) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }

    const customer = await Customer.create({ fullName, email: normalizedEmail, password, phone });
    return res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }
    return res.status(500).json({ success: false, message: "Unable to register customer" });
  }
};

const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const customer = await Customer.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!customer || !(await customer.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(customer._id.toString());
    return res.cookie("token", token, cookieOptions).status(200).json({
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to log in" });
  }
};

const getMyProfile = (req, res) => {
  return res.status(200).json({
    _id: req.user._id,
    fullName: req.user.fullName,
    email: req.user.email,
    phone: req.user.phone,
  });
};

const logoutCustomer = (req, res) => {
  return res.clearCookie("token", { httpOnly: true, secure: cookieOptions.secure, sameSite: "lax" }).status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Old and new passwords are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must contain at least 6 characters" });
    }

    const customer = await Customer.findById(req.user._id).select("+password");
    if (!(await customer.comparePassword(oldPassword))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    customer.password = newPassword;
    await customer.save();
    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to change password" });
  }
};

const Hello = (req, res) => {
  return res.status(200).json({
    message: "Hello Nipun",
  });
};

module.exports = { registerCustomer, loginCustomer, getMyProfile, logoutCustomer, changePassword, Hello};
