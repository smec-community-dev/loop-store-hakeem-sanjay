const express=require('express')
const session = require('express-session')
let hbs=require('hbs')
const dotenv=require('dotenv').config()
const bcrypt=require('bcrypt')
const User=require('../Model/user')
let Seller=require('../Model/Seller')
const Admin=require('../Model/Admin')
const adminauth = require('../middleware/adminauth')
let router=express.Router()

const cookieParser=require('cookie-parser')


let ademail=process.env.ADMIN_EMAIL
let password=process.env.ADMIN_PASSWORD


router.use(session({
    secret:process.env.ADMIN_SESSION_SECRET,
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
    let sellerdata=await Seller.find()
    let totaluser=userdata.length
    let totalseller=sellerdata.length
    console.log(sellerdata);
    
    
console.log("userdata:"+userdata);


    res.render('admin/adminprofile',{usercount:totaluser,sellercount:totalseller ,seller:sellerdata ,user:userdata})
})



module.exports=router