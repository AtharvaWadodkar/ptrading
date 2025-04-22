const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const fetch = require("node-fetch");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs"); // ✅ bcrypt for password hashing

const app = express();
const server = http.createServer(app);

const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect('mongodb+srv://dbUser:test@cluster0.a6arr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB connection error:", err));

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const API_KEY = "key";
let SYMBOL = "AAPL";
const PORT = process.env.PORT || 5000;

// -------------------------
// Registration Route
// -------------------------
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ success: false, message: "Username already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ success: true, message: "User registered successfully" });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

// -------------------------
// Login Route
// -------------------------
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    res.json({ success: true, token: "dummy-token", username });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

// -------------------------
// Real-Time Stock Price (Finnhub)
// -------------------------
async function fetchStockPrice() {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${SYMBOL}&token=${API_KEY}&_=${Date.now()}`
    );
    const data = await response.json();

    if (data.c) {
      const realTimePrice = parseFloat(data.c).toFixed(2);
      console.log(`✅ Emitting real-time price for ${SYMBOL}: $${realTimePrice}`);
      io.emit("priceUpdate", { symbol: SYMBOL, price: realTimePrice });
    } else {
      console.log("⚠️ Error: No price data found. Response:", data);
    }
  } catch (error) {
    console.error("🚨 Error fetching stock price:", error);
  }
}

setInterval(fetchStockPrice, 5000);

// -------------------------
// WebSocket
// -------------------------
io.on("connection", (socket) => {
  console.log("🔌 New client connected");

  fetchStockPrice();

  socket.on("changeSymbol", (newSymbol) => {
    console.log(`🔄 Changing symbol to: ${newSymbol}`);
    SYMBOL = newSymbol.toUpperCase();
    fetchStockPrice();
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

// -------------------------
// Serve React Frontend
// -------------------------
app.use(express.static(path.join(__dirname, "client/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
