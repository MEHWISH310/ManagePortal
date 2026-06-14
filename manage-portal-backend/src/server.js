const express  = require("express");
const cors     = require("cors");
const dotenv   = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth",          require("./routes/auth"));
app.use("/api/users",         require("./routes/users"));
app.use("/api/tasks",         require("./routes/tasks"));
app.use("/api/leaves",        require("./routes/leaves"));
app.use("/api/announcements", require("./routes/announcements"));
app.use("/api/payroll", require("./routes/payroll"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/email", require("./routes/email"));

app.get("/", (req, res) => res.json({ message: "ManagePortal API running" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

console.log("JWT_SECRET:", process.env.JWT_SECRET);