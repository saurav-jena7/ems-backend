const Employee = require("../models/Employee");

// ── Auto-generate a unique Employee ID  e.g. EMP-2026-00042 ────────────────
const generateEmployeeId = async () => {
  const year = new Date().getFullYear();
  const prefix = `EMP-${year}-`;

  // Find the highest existing numeric suffix for this year
  const latest = await Employee.findOne(
    { employeeId: { $regex: `^${prefix}` } },
    { employeeId: 1 },
    { sort: { employeeId: -1 } }
  );

  let next = 1;
  if (latest) {
    const parts = latest.employeeId.split("-");
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) next = num + 1;
  }

  // Zero-pad to 5 digits: EMP-2026-00001
  return `${prefix}${String(next).padStart(5, "0")}`;
};

// @desc    Add a new employee
// @route   POST /api/employees
// @access  Private
const addEmployee = async (req, res, next) => {
  try {
    const {
      employeeId: rawId,
      idMode,          // "auto" | "manual"
      name, email, phone, department, designation,
      salary, joinDate, address, status,
    } = req.body;

    if (!name || !email || !phone || !department || !designation || !salary || !joinDate) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all required fields" });
    }

    // Decide the final employee ID
    let employeeId;
    if (idMode === "manual") {
      if (!rawId || !rawId.trim()) {
        return res.status(400).json({ success: false, message: "Employee ID is required" });
      }
      employeeId = rawId.trim().toUpperCase();

      // Check for duplicates when entered manually
      const exists = await Employee.findOne({ employeeId });
      if (exists) {
        return res.status(409).json({
          success: false,
          field: "employeeId",
          message: `Employee ID "${employeeId}" is already in use. Please choose a different one.`,
        });
      }
    } else {
      // auto mode — generate and retry once if there's a race collision
      employeeId = await generateEmployeeId();
    }

    const employee = await Employee.create({
      employeeId,
      name, email, phone, department, designation,
      salary, joinDate, address, status,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: "Employee added", data: employee });
  } catch (error) {
    next(error);
  }
};

// @desc    Preview the next auto-generated ID (no DB write)
// @route   GET /api/employees/preview-id
// @access  Private
const previewAutoId = async (req, res, next) => {
  try {
    const id = await generateEmployeeId();
    res.status(200).json({ success: true, employeeId: id });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all employees (with optional search)
// @route   GET /api/employees?search=<query>&page=1&limit=10
// @access  Private
const getEmployees = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10, department, status } = req.query;

    const filter = {};

    if (search && search.trim()) {
      filter.$or = [
        { employeeId:  { $regex: search.trim(), $options: "i" } },
        { name:        { $regex: search.trim(), $options: "i" } },
        { email:       { $regex: search.trim(), $options: "i" } },
        { department:  { $regex: search.trim(), $options: "i" } },
        { designation: { $regex: search.trim(), $options: "i" } },
        { phone:       { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (department) filter.department = { $regex: department, $options: "i" };
    if (status)     filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [employees, total] = await Promise.all([
      Employee.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Employee.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: employees,
      pagination: {
        total,
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single employee by ID
// @route   GET /api/employees/:id
// @access  Private
const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private
const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const {
      employeeId: rawId,
      name, email, phone, department, designation,
      salary, joinDate, address, status,
    } = req.body;

    // Allow updating the employee ID only if it changed
    let employeeId = employee.employeeId;
    if (rawId && rawId.trim().toUpperCase() !== employeeId) {
      const newId = rawId.trim().toUpperCase();
      const exists = await Employee.findOne({ employeeId: newId });
      if (exists) {
        return res.status(409).json({
          success: false,
          field: "employeeId",
          message: `Employee ID "${newId}" is already in use.`,
        });
      }
      employeeId = newId;
    }

    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      { employeeId, name, email, phone, department, designation, salary, joinDate, address, status },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: "Employee updated", data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private
const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    await Employee.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addEmployee,
  previewAutoId,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
};
