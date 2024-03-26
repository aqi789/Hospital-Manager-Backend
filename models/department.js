const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  deptName: String,
  image: String,
  deptYear: Number,
  deptDesc: String
});

const departmentModel = mongoose.model("departments", departmentSchema);
module.exports = departmentModel;
