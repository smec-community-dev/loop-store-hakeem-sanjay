const express=require("express")
const { route } = require("./sellerRouter")
const bcrypt=require("bcrypt")
const cookie=require("cookie-parser")
const mongostore=require("connect-mongo")
const router=express.Router()
const session=require("express-session")
const usermodel=require("../Model/user")
const Products=require("../Model/Product")
const userauth=require("../middleware/userauth")
const Category=require("../Model/Category")
const Seller = require('../Model/Seller')

router.use(session({
    secret: "THIS_IS_SECRET_KEY",
    resave: false,
    saveUninitialized: false,
    store: mongostore.create({
        mongoUrl: "mongodb://localhost:27017/LiveProject",   
        collectionName: "usersession",                     
        ttl: 60 * 60,                                    
    }),
    cookie: {
        maxAge: 1000 * 60 * 60,  
        httpOnly: true,
        secure: false
    }
}));


router.get("/register",(req,res)=>{
    res.render("user/register")
})
router.post("/register",async(req,res)=>{
    let hased=await bcrypt.hash(req.body.password,10)
    let data=await usermodel.create({
        name:req.body.firstname,
        email:req.body.email,
        phone:req.body.phone,
        password:hased,
    })
    res.redirect("/login")
})
router.get("/login",(req,res)=>{
    res.render("user/login")
})
router.post("/login",async(req,res)=>{
    let data=await usermodel.findOne({email:req.body.email})
    if(!data){
        res.redirect("/login")
    }
    let matched=await bcrypt.compare(req.body.password,data.password)
    if(!matched){
        res.redirect("/login")
    }
    req.session.user={
        userid:data._id,
        email:data.email,
        username:data.username
    }
    res.redirect("/")
})
router.get("/profile",async(req,res)=>{
    let data=await usermodel.findById(req.session.user.userid)
    res.render("user/profile",{data})
})
router.post("/profile",async(req,res)=>{
    let data=await usermodel.findById(req.session.user.userid)
    await usermodel.findByIdAndUpdate(data._id,{firstname:req.body.firstname,email:req.body.email,phone:req.body.phone})
    res.redirect("/profile")
})
router.get("/",(req,res)=>{
    res.render("user/homepage")
})
// router.post("/userhomepage",async(req,res)=>{
//     let search=req.body.search.toLowerCase()
//     let data=await Products.find({$or:[{
//         name:{$regex:search,$options:"i"}
//     },{category:{$regex:search,$options:"i"}}]})
//     res.render("user/usercategorypage",{data})
// })

router.get("/usercategorypage",async(req,res)=>{
    let cat=req.query.cat
    let data=await Products.find({category:cat})
    res.render("user/usercategorypage",{cat,data})
})
module.exports=router