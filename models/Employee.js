const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, "Employee ID is required"],
      unique: true, // no two employees share the same ID
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Employee name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    designation: {
      type: String,
      required: [true, "Designation is required"],
      trim: true,
    },
    salary: {
      type: Number,
      required: [true, "Salary is required"],
      min: 0,
    },
    joinDate: {
      type: Date,
      required: [true, "Join date is required"],
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    // The user (admin) who added this employee
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Text index for search across name, email, department, designation
employeeSchema.index(
  { name: "text", email: "text", department: "text", designation: "text" },
  { name: "employee_search" }
);

module.exports = mongoose.model("Employee", employeeSchema);
