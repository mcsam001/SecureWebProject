// server.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const { body, validationResult } = require("express-validator");
const bodyParser = require("body-parser");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();

app.use(bodyParser.json());
app.use(cors());

// JWT Secret Key
const JWT_SECRET = "your_secret_key_here";

// Database setup
const dbPath = path.resolve(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error connecting to SQLite database:", err);
  } else {
    console.log("Connected to SQLite database.");
    db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fullname TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT NOT NULL
            )
        `);
  }
});

// Middleware to authenticate JWT and set req.user
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized: Missing token" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden: Invalid token" });
    }
    req.user = user;
    next();
  });
};

// Middleware for role-based access control
const checkRole = (requiredRole) => (req, res, next) => {
  if (!req.user || req.user.role !== requiredRole) {
    return res
      .status(403)
      .json({ message: `Access denied: Requires ${requiredRole} role` });
  }
  next();
};

// Signup route
app.post(
  "/api/auth/signup",
  [
    body("fullname")
      .notEmpty()
      .withMessage("Full name is required")
      .trim()
      .escape(),
    body("email")
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("role")
      .notEmpty()
      .withMessage("Role is required")
      .isIn(["Admin", "Regular"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { fullname, email, password, role } = req.body;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const query = `INSERT INTO users (fullname, email, password, role) VALUES (?, ?, ?, ?)`;
      db.run(query, [fullname, email, hashedPassword, role], function (err) {
        if (err) {
          if (err.code === "SQLITE_CONSTRAINT") {
            return res.status(409).json({ message: "Email already exists" });
          }
          return res
            .status(500)
            .json({ message: "Error creating user", error: err });
        }
        res
          .status(201)
          .json({ message: "User created successfully", userId: this.lastID });
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }
);

// Login route
app.post(
  "/api/auth/login",
  [
    body("email")
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    db.get(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (err, user) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Error accessing database", error: err });
        }
        if (!user || !(await bcrypt.compare(password, user.password))) {
          return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: "1h" }
        );
        res
          .status(200)
          .json({
            message: "Login successful",
            token,
            user: { id: user.id, role: user.role },
          });
      }
    );
  }
);

// Protected route example
app.get("/api/products", authenticateJWT, checkRole("Admin"), (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error retrieving products", error: err });
    }
    res.status(200).json(rows);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
