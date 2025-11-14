const express = require('express')
const hbs = require('hbs')
const bcrypt = require('bcrypt')
let path=require('path')
const mongoose = require('mongoose')
const Seller = require('../Model/Seller')
let Product= require('../Model/Product')
const upload=require('../multer/multer')

const router = express.Router()


router.use('/uploads', express.static(path.join(__dirname, 'uploads')));




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
       return res.redirect('/home')
  }
  
})
router.get('/profile',(req,res)=>{
    res.render('seller/sellerprofile')
})

router.post('/profile', upload.array("productImages[]", 10),async(req,res)=>{
 let {name,description,price,stock,category}=req.body;
 console.log(req.files);
 console.log(req.body)
  const images = req.files.map(file => "/uploads/products/" + file.filename);

try{
  await Product.create({
    name:name,
    description:description,
    price:price,
    stock:stock,
    //category:category,
    images:images

  })
  console.log('the data saved in database');
 return res.redirect('seller/profile')
  
}catch(error){
  console.error("data not saved in data base:"+error)
}


})



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
