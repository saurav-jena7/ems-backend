// Central error-handling middleware

const DUPLICATE_MESSAGES = {
  email:      "This email address is already registered. Please log in or use a different email.",
  phone:      "This phone number is already associated with an account. Please use a different number.",
  employeeId: "This Employee ID is already in use. Please choose a different one.",
};

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // MongoDB duplicate key error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]; // "email" | "phone" | other
    const message =
      DUPLICATE_MESSAGES[field] ||
      `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    return res.status(409).json({ success: false, field, message });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(", ") });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
};

module.exports = errorHandler;
