const express = require('express');
const hbs = require('hbs');
const mongoose = require('mongoose');
const sellerRouter = require('./Routes/sellerRouter');
const userrouter = require("./Routes/userrouter");
const adminrouter = require('./Routes/adminrouter');
const passport = require('passport');
const http = require("http");

require("dotenv").config();

// ✅ Correct WebSocket import
const initWebSocket = require("./websocket/websocket");

let app = express();

// =========================
// MIDDLEWARE
// =========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use('/uploads', express.static('uploads'));


// =========================
// MONGO CONNECTION
// =========================
mongoose
  .connect("mongodb://localhost:27017/LiveProject")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ Connection error:", err));


// =========================
// ROUTES
// =========================
app.use('/seller', sellerRouter);
app.use("/", userrouter);
app.use("/admin", adminrouter);


// =========================
// CREATE HTTP SERVER + WEBSOCKET
// =========================
const server = http.createServer(app);

initWebSocket(server);  // ⭐ Works now


// =========================
// START SERVER
// =========================
server.listen(4000, () => {
  console.log("🚀 Server running at http://localhost:4000");
  console.log("🔌 WebSocket active on same port");
});
