const express=require('express')
const session = require('express-session')
let hbs=require('hbs')
const dotenv=require('dotenv').config()
const bcrypt=require('bcrypt')
const User=require('../Model/user')
let Seller=require('../Model/Seller')
const Admin=require('../Model/Admin')
let category=require('../Model/Category')
const adminauth = require('../middleware/adminauth')
let router=express.Router()
const categorymulter=require('../multer/catogerymulter')


const cookieParser=require('cookie-parser')
const Category = require('../Model/Category')
const Order = require('../Model/Order')

hbs.registerHelper("inc",(value)=>{
    return parseInt(value) + 1;
})


router.use(session({
    secret:"ADMIN@123",
    resave:false,
    saveUninitialized:true,
        cookie: {
        maxAge: 1000 * 60 * 60    // <--- session time here
    }
}))



router.get('/login',(req,res)=>{
    res.render('admin/adminlogin')

})

router.post('/login',async(req,res)=>{

let {email,password}=req.body

    let find =await Admin.findOne({email})
    if(!find){
        console.log("this is not matching email") 
        return res.redirect('/admin/login')    
    }
    let match=await bcrypt.compare(password,find.password)
    if(!match){
        console.log("the given password is wrong")
        return res.redirect('/admin/login')    

    }
    if(match){

      req.session.adminEmail= email;
      res.redirect('/admin/profile')

    }

})
// router.post('/create_admin_new',async(req,res)=>{
//     let {email,password}=req.body
//     let hash=await bcrypt.hash(password,10)
//     console.log("hashed:"+hash);
    
//   try{
//     await Admin.create({
//         email:email,
//         password:hash
//     })
//     console.log('data added to db')
//   }catch(error){
//     console.error(error);
//     console.log("error adding to database");
    
//   }

// })

router.get('/profile',adminauth,async(req,res)=>{
    let userdata=await User.find()
    let sellerdata=await Seller.find().populate('products')
     let categoryy= await Category.find()
     const orders=await Order.find()
     let totalorder=orders.length
    let totaluser=userdata.length
    let totalseller=sellerdata.length
    let categorycount=categoryy.length
    console.log(categoryy);
    
    
console.log("userdata:"+userdata);


    res.render('admin/adminprofile',{usercount:totaluser,sellercount:totalseller ,totalorder:totalorder,seller:sellerdata ,user:userdata,category:categoryy,categorycount:categorycount})
})
router.post('/category/add',categorymulter.single("image"),async(req,res)=>{
    let {name,description}=req.body
    // const image = req.file.filename(file => "/uploads/category/" + file.filename);
    // console.log("req.body"+req.body);
       // SAFELY GET IMAGE PATH
        let imagePath = "";
        if (req.file) {
            imagePath = req.file.path; // FULL PATH → always string
        }

  try{
    await Category.create({
        name:name,
        description:description,
        image:imagePath
        
    })
    console.log("catogery added to db");
    return res.redirect("/admin/profile")
  }catch(error){
    console.error(error);
    
  }
})
router.post('/catogery/delete/:id',async(req,res)=>{
    let id =req.params.id

    try{
        await category.findByIdAndDelete(id)
        console.log("data deleted success fully");
        return res.redirect('/admin/profile')
    }catch(error){
        console.error(error)
    }
})


module.exports=router