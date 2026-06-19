const express   = require("express");
const cors      = require("cors");
const dotenv    = require("dotenv");
const http      = require("http");
const { Server } = require("socket.io");
const connectDB  = require("./config/db");

dotenv.config();
connectDB();

const app    = express();
const server = http.createServer(app);

// ── Socket.IO setup ───────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:      process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

// Make io accessible in all route handlers via req.io
app.use((req, _, next) => { req.io = io; next(); });

// Track connected users
io.on("connection", (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  // Client sends its role so we can join role-based rooms
  socket.on("join", ({ role, userId }) => {
    if (role === "admin") socket.join("admins");
    socket.join(`user:${userId}`);     // personal room for targeted events
    console.log(`[WS] ${socket.id} joined room: ${role}, user:${userId}`);
  });

  socket.on("disconnect", () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// Export io so routes can emit events
module.exports.io = io;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",          require("./routes/auth"));
app.use("/api/users",         require("./routes/users"));
app.use("/api/tasks",         require("./routes/tasks"));
app.use("/api/leaves",        require("./routes/leaves"));
app.use("/api/announcements", require("./routes/announcements"));
app.use("/api/payroll",       require("./routes/payroll"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/reports",       require("./routes/reports"));

// Optional routes (only load if file exists)
try { app.use("/api/email",    require("./routes/email"));    } catch {}
try { app.use("/api/payment",  require("./routes/payment"));  } catch {}
try { app.use("/api/training", require("./routes/training")); } catch {}

app.get("/", (req, res) => res.json({ message: "ManagePortal API running" }));

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server + WebSocket running on port ${PORT}`);
  try {
    const { startExpirePaymentsJob } = require("./jobs/expirePayments");
    startExpirePaymentsJob();
  } catch {}
});