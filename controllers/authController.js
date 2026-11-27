const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Helper: sign a JWT
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res, next) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Normalise inputs before uniqueness checks
    const normalisedEmail = email.trim().toLowerCase();
    const normalisedPhone = phone.replace(/[\s-]/g, "");

    // Check email uniqueness
    const emailExists = await User.findOne({ email: normalisedEmail });
    if (emailExists) {
      return res.status(409).json({
        success: false,
        field: "email",
        message: "This email address is already registered. Please log in or use a different email.",
      });
    }

    // Check phone uniqueness
    const phoneExists = await User.findOne({ phone: normalisedPhone });
    if (phoneExists) {
      return res.status(409).json({
        success: false,
        field: "phone",
        message: "This phone number is already associated with an account. Please use a different number.",
      });
    }

    const user = await User.create({
      name: name.trim(),
      phone: normalisedPhone,
      email: normalisedEmail,
      password,
    });

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      phone: req.user.phone,
      email: req.user.email,
    },
  });
};

module.exports = { signup, login, getMe };
