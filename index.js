const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const path = require("path");
const multer = require("multer");
const bodyParser=require("body-parser")
const port = 3001;
const userModel = require("./models/user");
const departmentModel = require("./models/department");
const employeeModel = require("./models/employee");
const departmentHeadModel = require("./models/departmentHead");
const fs = require("fs");
const headModel = require("./models/departmentHead");
const { Types: { ObjectId } } = require('mongoose');
const { error } = require("console");
const id = new ObjectId(); // Correct usage with Mongoose.Types.ObjectId

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.static("public"));
app.use(bodyParser.json());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

mongoose
  .connect("mongodb://127.0.0.1:27017/hospital")
  .then(() => {
    console.log("MongoDB is connected");
  })
  .catch((err) => {
    console.error(err);
    console.log("Error connecting to MongoDB");
  });

//authentication, autherization
const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json("Token is missing");
  } else {
    jwt.verify(token, "key", (err, decoded) => {
      if (err) {
        return res.json("Error with token");
      } else {
        if (decoded.role === "admin") {
          next();
        } else {
          return res.json("Not admin");
        }
      }
    });
  }
};

app.get("/dashboard", verifyUser, (req, res) => {
  res.json("Success");
});

app.post("/signup", (req, res) => {
  const { name, email, password } = req.body;
  bcrypt
    .hash(password, 7)
    .then((hash) => {
      userModel
        .create({ name, email, password: hash })
        .then((user) => res.json("Success"))
        .catch((err) => res.json(err));
    })
    .catch((err) => res.json(err));
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  userModel.findOne({ email: email }).then((user) => {
    if (user) {
      bcrypt.compare(password, user.password, (err, response) => {
        if (response) {
          const token = jwt.sign(
            { email: user.email, role: user.role },
            "key",
            { expiresIn: "1d" }
          );
          res.cookie("token", token);
          return res.json({ Status: "Success", role: user.role });
        } else {
          return res.json("Password is incorrect");
        }
      });
    } else {
      return res.json("No record");
    }
  });
});

//department crud
app.get("/", (req, res) => {
  res.send("Welcome");
});

app.post("/DeptPost", upload.single("deptImg"), async (req, res) => {
  try {
    const { deptName, deptYear, deptDesc } = req.body;
    const image = req.file.filename;
    const department = await departmentModel.create({
      deptName,
      image,
      deptYear,
      deptDesc,
    });
    res.json(department);
    console.log(department);
    console.log("Image path:", image);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/getDept", async (req, res) => {
  try {
    const departments = await departmentModel.find();
    res.json(departments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/updateDept/:id", async (req, res) => {
  const { id } = req.params;
  const {
    departmentName,
    departmentYear,
    departmentDescription,
    departmentImage,
  } = req.body;

  try {
    let department = await departmentModel.findById(id);

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    // Update department fields
    department.deptName = departmentName;
    department.deptYear = departmentYear;
    department.deptDesc = departmentDescription;
    department.image = departmentImage;
    // Save the updated department
    await department.save();

    res
      .status(200)
      .json({ message: "Department updated successfully", department });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Route to get a department by ID
app.get("/getDeptById/:id", async (req, res) => {
    const { id } = req.params;

    // Validate if the provided ID is a valid ObjectId
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ error: "Invalid department ID" });
    }

    try {
        const department = await departmentModel.findById(id);
        if (!department) {
            return res.status(404).json({ error: "Department not found" });
        }
        res.json(department);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update the '/deptDelete/:id' route
app.delete("/deptDelete/:id", (req, res) => {
  const { id } = req.params;
  departmentModel
    .findByIdAndDelete(id) // Remove curly braces around id
    .then((deletedDept) => {
      console.log(deletedDept);
      res.json(deletedDept);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    });
});

app.get("/getDeptById/:id", (req, res) => {
  const { id } = req.params;
  departmentModel
    .findById(id) // Remove curly braces around id
    .then((department) => {
      if (!department) {
        return res.status(404).json({ error: "Department not found" });
      }
      res.json(department);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    });
});

app.get("/getDeptByName/:name", (req, res) => {
  const { name } = req.params;
  departmentModel
    .findOne({ deptName: name }) // Query by department name
    .then((department) => {
      if (!department) {
        return res.status(404).json({ error: "Department not found" });
      }
      res.json(department);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    });
});





///employee

// Create new employee
app.post("/empPost", upload.single("empImage"), async (req, res) => {
  try {
    const { name, number, age, description, department,report } = req.body;
    const empImg = req.file.filename;
    const employee = await employeeModel.create({
      name,
      number,
      age,
      description,
      department,
      image: empImg,
      report,
    });
    res.json(employee);
    console.log(employee);
    console.log("Image path", empImg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all employees
app.get("/getEmp", async (req, res) => {
  try {
    const employees = await employeeModel.find();
    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete employee
app.delete("/empDelete/:id", (req, res) => {
  const { id } = req.params;
  employeeModel
    .findByIdAndDelete({ _id: id })
    .then((deletedEmployee) => {
      console.log(deletedEmployee);
      res.json(deletedEmployee);
    })
    .catch((err) => {
      console.error(err);
    });
});
//get employee by id
app.get("/getEmp/:id", async (req,res)=>{
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send("Invalid employee  ID.");
    }
    const employee = await employeeModel.findById(id);
    if (!employee) {
      return res.status(404).send("employee not found.");
    }
    res.status(200).json(employee);
  } catch (err) {
    console.error("Error fetching employee : ", err);
    res.status(500).send("An error occurred while fetching employee.");
  }
}
)

app.get("/getReport", async (req, res) => {
  try {
    const report = await departmentHeadModel.find();
    res.json(report);
  } catch (err) {
    console.error("Error fetching report to: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/updateEmployee/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedEmployee = req.body;
    await employeeModel.findByIdAndUpdate(id, updatedEmployee);
    res.status(200).send(" employee updated successfully!");
  } catch (err) {
    console.error("Error updating employee: ", err);
    res.status(500).send("An error occurred while updating employee.");
  }
});



//deptHead

app.post("/headPost", upload.single("headImage"), async (req, res) => {
  try {
    const { name, number, age, description, department } = req.body;
    const headImg = req.file.filename;
    const head = await departmentHeadModel.create({
      name,
      number,
      age,
      description,
      department,
      image: headImg,
    });
    res.status(201).json(head);
    console.log(head);
    console.log("Image path", headImg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/getHead", async (req, res) => {
  try {
    const heads = await departmentHeadModel.find();
    res.json(heads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/headDelete/:id", (req, res) => {
  const { id } = req.params;
  departmentHeadModel
    .findByIdAndDelete({ _id: id })
    .then((deletedHead) => {
      console.log(deletedHead);
      res.json(deletedHead);
    })
    .catch((err) => {
      console.error(err);
    });
});

app.get("/getDeptHead/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send("Invalid department head ID.");
    }
    const departmentHead = await departmentHeadModel.findById(id);
    if (!departmentHead) {
      return res.status(404).send("Department head not found.");
    }
    res.status(200).json(departmentHead);
  } catch (err) {
    console.error("Error fetching department head: ", err);
    res.status(500).send("An error occurred while fetching department head.");
  }
});

app.put("/updateDeptHead/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const updatedHead = req.body;
    await departmentHeadModel.findByIdAndUpdate(id, updatedHead);
    res.status(200).send("Department head updated successfully!");
  } catch (err) {
    console.error("Error updating department head: ", err);
    res.status(500).send("An error occurred while updating department head.");
  }
});

app.get("/getHeadByName/:name", (req,res)=>{
  const {name}=req.params;
  departmentHeadModel.findOne({name:name})
  .then((head)=>{
    if(!head){
      return res.status(404).json({error:"department head not found"});
    }
    res.json(head);
  }).catch((err)=>{
    console.log(err);
    res.status(500).json({err:'Internal server error'})
  })
})

app.get("/getDepartments", async (req, res) => {
  try {
    const departments = await departmentModel.find();
    res.json(departments);
  } catch (err) {
    console.error("Error fetching departments: ", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
