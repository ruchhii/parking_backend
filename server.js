const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Create MySQL Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "parking_management"
});

// ✅ Connect to Database
db.connect(err => {
    if (err) {
        console.error("❌ Database connection failed:", err);
        return;
    }
    console.log("✅ Connected to MySQL Database");
});

// ✅ USER REGISTRATION with Stored Procedure
app.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "⚠️ Username and password are required." });
    }

    db.query("CALL RegisterUser(?, ?)", [username, password], (err, result) => {
        if (err) {
            if (err.sqlState === "45000") {
                return res.status(400).json({ success: false, message: "⚠️ User already exists!" });
            }
            return res.status(500).json({ success: false, message: "⚠️ Database error" });
        }

        res.json({ success: true, message: "✅ User registered successfully!" });
    });
});

// ✅ USER LOGIN
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "⚠️ Database error" });

        if (results.length === 0 || results[0].password !== password) {
            return res.status(401).json({ success: false, message: "⚠️ Invalid credentials" });
        }

        const user = results[0];
        const token = jwt.sign({ id: user.id, username: user.username, role: "user" }, "secret", { expiresIn: "1h" });

        res.json({ success: true, token, user_id: user.id });
    });
});

// ✅ ADMIN LOGIN
app.post("/admin/login", (req, res) => {
    const { username, password } = req.body;

    db.query("SELECT * FROM admins WHERE username = ? AND password = ?", [username, password], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "⚠️ Database error" });

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: "⚠️ Invalid credentials" });
        }

        const admin = results[0];
        const token = jwt.sign({ id: admin.id, username: admin.username, role: "admin" }, "secret", { expiresIn: "1h" });

        res.json({ success: true, token, role: "admin" });
    });
});

// ✅ MIDDLEWARE: VERIFY ADMIN
function verifyAdmin(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "⚠️ Unauthorized: No token provided" });

    jwt.verify(token, "secret", (err, decoded) => {
        if (err || decoded.role !== "admin") {
            return res.status(403).json({ success: false, message: "⚠️ Forbidden: Not an admin" });
        }
        next();
    });
}

// ✅ ADD PARKING SLOT (Admin Only)
app.post("/api/slots", verifyAdmin, (req, res) => {
    const { slot_number } = req.body;

    if (!slot_number) {
        return res.status(400).json({ success: false, message: "⚠️ Slot number is required." });
    }

    db.query("INSERT INTO parking_slots (slot_number, is_available) VALUES (?, TRUE)", [slot_number], (err, result) => {
        if (err) {
            console.error("❌ Error adding slot:", err);

            // Check if the error comes from MySQL trigger
            if (err.code === "ER_SIGNAL_EXCEPTION") {  
                return res.status(400).json({ success: false, message: "⚠️ Slot number already exists!" });
            }

            return res.status(500).json({ success: false, message: "⚠️ Slot number already exists!" });
        }

        res.status(201).json({ success: true, message: "✅ Slot added successfully!" });
    });
});



// ✅ GET ALL PARKING SLOTS
app.get("/api/slots", (req, res) => {
    db.query("SELECT * FROM parking_slots", (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "⚠️ Error fetching slots" });

        res.json(results);
    });
});

// ✅ MIDDLEWARE: AUTHENTICATE USER
function authenticateUser(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "⚠️ Unauthorized: No token provided" });
    }

    jwt.verify(token, "secret", (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: "⚠️ Invalid token" });
        }
        req.user_id = decoded.id;
        next();
    });
}

// ✅ BOOK A PARKING SLOT
app.post("/api/bookings", authenticateUser, (req, res) => {
    const { slot_id } = req.body;
    const user_id = req.user_id;

    if (!slot_id || !user_id) {
        return res.status(400).json({ success: false, message: "⚠️ Missing slot_id or user_id" });
    }

    db.query("SELECT * FROM parking_slots WHERE id = ? AND is_available = 1", [slot_id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "⚠️ Database error" });

        if (results.length === 0) {
            return res.status(400).json({ success: false, message: "⚠️ Slot is not available" });
        }

        db.query("INSERT INTO bookings (user_id, slot_id) VALUES (?, ?)", [user_id, slot_id], (err, result) => {
            if (err) return res.status(500).json({ success: false, message: "⚠️ Error booking slot" });

            db.query("UPDATE parking_slots SET is_available = 0 WHERE id = ?", [slot_id], (err, updateResult) => {
                if (err) return res.status(500).json({ success: false, message: "⚠️ Error updating slot status" });

                res.json({ success: true, message: "✅ Slot booked successfully!" });
            });
        });
    });
});

// ✅ CANCEL A BOOKING
app.delete("/api/bookings/:id", authenticateUser, (req, res) => {
    const booking_id = req.params.id;

    db.query("SELECT slot_id FROM bookings WHERE id = ?", [booking_id], (err, bookings) => {
        if (err) return res.status(500).json({ success: false, message: "⚠️ Error fetching booking" });

        if (bookings.length === 0) {
            return res.status(404).json({ success: false, message: "⚠️ Booking not found." });
        }

        const slot_id = bookings[0].slot_id;

        db.query("DELETE FROM bookings WHERE id = ?", [booking_id], (err, result) => {
            if (err) return res.status(500).json({ success: false, message: "⚠️ Error canceling booking" });

            db.query("UPDATE parking_slots SET is_available = 1 WHERE id = ?", [slot_id]);
            res.json({ success: true, message: "✅ Booking canceled successfully!" });
        });
    });
});

// ✅ START SERVER
const PORT = 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
