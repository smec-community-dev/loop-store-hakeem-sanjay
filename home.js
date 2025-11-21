const express=require('express')
const hbs=require('hbs')
const mongoose=require('mongoose')
const sellerRouter=require('./Routes/sellerRouter')
const userrouter=require("./Routes/userrouter")
const adminrouter=require('./Routes/adminrouter')
const passport=require('passport')


let app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine','hbs')
app.set('views', __dirname + '/views')
app.use(express.static(__dirname + '/public'))
require("dotenv").config();


app.use('/uploads', express.static('uploads'));



mongoose
  .connect("mongodb://localhost:27017/LiveProject")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ Connection error:", err));



app.use('/seller', sellerRouter)
app.use("/",userrouter)
app.use("/admin", adminrouter)



app.listen(4000, (req, res) => {
    console.log("  the server 4000 is running http://localhost:4000 ");

})