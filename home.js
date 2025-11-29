const express = require('express');
const hbs = require('hbs');
const mongoose = require('mongoose');
const sellerRouter = require('./Routes/sellerRouter');
const userrouter = require("./Routes/userrouter");
const adminrouter = require('./Routes/adminrouter');
const passport = require('passport');
const http = require("http");

require("dotenv").config();



let app = express();
const { initSellerWebSocket } = require("./websocket/sellerws");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ Connection error:", err));


// Routes
app.use('/seller', sellerRouter);
app.use("/", userrouter);
app.use("/admin", adminrouter);


const server = http.createServer(app);

initSellerWebSocket(server);

server.listen(4000, () => {
    console.log("🚀 HTTP Server http://localhost:4000");
    console.log("💬 Seller WS at ws://localhost:4000/");
});
