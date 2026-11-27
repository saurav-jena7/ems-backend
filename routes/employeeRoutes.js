const express = require("express");
const router = express.Router();
const {
  addEmployee,
  previewAutoId,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");
const { protect } = require("../middleware/auth");

// All employee routes require authentication
router.use(protect);

// GET  /api/employees            – list / search employees
// POST /api/employees            – add employee
router.route("/").get(getEmployees).post(addEmployee);

// GET /api/employees/preview-id  – peek at next auto-generated ID (no DB write)
// MUST be declared before /:id  so Express doesn't treat "preview-id" as a Mongo ObjectId
router.get("/preview-id", previewAutoId);

// GET    /api/employees/:id  – single employee
// PUT    /api/employees/:id  – update employee
// DELETE /api/employees/:id  – delete employee
router.route("/:id").get(getEmployeeById).put(updateEmployee).delete(deleteEmployee);

module.exports = router;
