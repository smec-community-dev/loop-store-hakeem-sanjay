const express = require('express')
const hbs = require('hbs')
const bcrypt = require('bcrypt')
let path=require('path')
const mongoose = require('mongoose')
const Seller = require('../Model/Seller')
let Product= require('../Model/Product')
const upload=require('../multer/multer')
const sellerauth=require('../middleware/sellerauth')


const router = express.Router()
const cookieParser=require('cookie-parser')
const session=require('express-session')
const MongoStore=require('connect-mongo')
router.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Cookie parser
router.use(cookieParser());

// Session + MongoStore
router.use(
  session({
    secret: "Hakeem@123",    // Change this
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: "mongodb://localhost:27017/LiveProject", // your DB
      collectionName: "seller_sessions", // Where sessions will be stored
      ttl: 24 * 60 * 60, // Session lifetime (1 day)
    }),
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // cookie lifetime (1 day)
    },
  })
);




router.get('/register', (req, res) => {
    res.render('seller/sellerregister')
})
router.post('/register', async (req, res) => {
    let { businessname, email, phone, location, seller_description, password } = req.body
    let hashed = await bcrypt.hash(password, 10)
    console.log("password hashed:" + hashed);
    try {
        await Seller.create({
            name: businessname, 
            email: email,
            phone: phone,
            location: location,
            seller_discription: seller_description,
            password: hashed
        })
        console.log("data inserted to Data base ");
        res.redirect('/seller/login')

    }catch(error){
        console.error("error in adding sseller data into DataBase:"+error);
        
    }


})

router.get('/login', (req, res) => {
    res.render('seller/sellerlogin')
})


router.post('/login', async(req, res) => {

    let {email,password}= req.body;

    let data=await Seller.findOne({email:email})
    if(!data){
        console.log("the given email is incorrect");
        //alert('the given email is Wrong')
         return res.redirect('/seller/login');
    }
  let match =await bcrypt.compare(password,data.password)
  if(!match){
    console.log("the given password is Wrong");
      //  alert('the given password is Wrong')
      return res.redirect('/seller/login')
      
  }
  if(match){
    console.log("your login is success full");
     req.session.seller = {
        id: data._id.toString(),  
        name: data.name,
        email: data.email,
    };

       return res.redirect('/seller/profile')
  }
  
})
router.get('/profile',sellerauth,async(req,res)=>{
    let data=await Product.find()

  
  
  
    console.log("this is req.session.seller:"+req.session.seller.id)
    console.log('datas:'+data);
    
    res.render('seller/sellerprofile',{seller:req.session.seller, datas:data})
})

router.post('/profile', upload.array("productImages[]", 10),async(req,res)=>{
 let {name,description,price,stock,category}=req.body;
  const sellerID = req.session.seller.id;

  console.log("Fetched Seller ID:", sellerID);
 console.log(req.files);
 console.log(req.body)
  const images = req.files.map(file => "/uploads/products/" + file.filename);

try{
  await Product.create({
    name:name,
    description:description,
    price:price,
    stock:stock,
    seller:sellerID,
    //category:category,
    images:images

  })
  console.log('the data saved in database');
 return res.redirect('/seller/profile')
  
}catch(error){
  console.error("data not saved in data base:"+error)
}


})
router.get('/profile/update',async(req,res)=>{
  let id=req.query.id
  console.log("id:"+id);
  let data = await Product.findById(id)
  console.log(data);
  
  
  res.render('seller/seller_update',{product:data})
})

// router.post("/update/product",async(req,res)=>{
//   let id = req.query.id
//   console.log("id:"+id);
// console.log(req.body);

//   try{
//     await Product.findByIdAndUpdate(id,{
//     name:req.body.name,
//     description:req.body.description,
//     price:req.body.price,
//     stock:req.body.stock
//    // category:category
//   })
//   res.redirect('/seller/profile')
// }catch(error){
//   console.error(error);
//   console.log("data not updated");
//   console.log(req.query);
  
  
// }
  
  
  
// })

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/seller/login");
  });
});

//  {
//     name:name,
//     description:description,
//     price:price,
//     stock:stock,
//     category:category,
//Images:productImages,

// }
//loop123
//specifications: specs
module.exports = router;
