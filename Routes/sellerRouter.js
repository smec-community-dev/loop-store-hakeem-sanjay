const express = require('express')
const hbs = require('hbs')
const bcrypt = require('bcrypt')
let path = require('path')
const mongoose = require('mongoose')
const sellerauth = require('../middleware/sellerauth')
const Seller = require('../Model/Seller')
let Product = require('../Model/Product')
const upload = require('../multer/multer')
const Order = require('../Model/Order')
const Category = require('../Model/Category')

const router = express.Router()
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

const cookieParser = require('cookie-parser')
const session = require('express-session')
const MongoStore = require('connect-mongo')
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

  } catch (error) {
    console.error("error in adding sseller data into DataBase:" + error);

  }


})

router.get('/login', (req, res) => {
  res.render('seller/sellerlogin')
})


router.post('/login', async (req, res) => {

  let { email, password } = req.body;

  let data = await Seller.findOne({ email: email })
  if (!data) {
    console.log("the given email is incorrect");
    //alert('the given email is Wrong')
    return res.redirect('/seller/login');
  }
  let match = await bcrypt.compare(password, data.password)
  if (!match) {
    console.log("the given password is Wrong");
    //  alert('the given password is Wrong')
    return res.redirect('/seller/login')

  }
  if (match) {
    console.log("your login is success full");
    req.session.seller = {
      id: data._id.toString(),
      name: data.name,
      email: data.email,
    };

    return res.redirect('/seller/profile')
  }

})
router.get('/profile', sellerauth, async (req, res) => {
  const sellerID = req.session.seller.id;

  try {

    // 1️⃣ Correct: get only orders containing items sold by this seller
    const sellerOrders = await Order.find({
      "items.seller": sellerID
    })
      .populate("items.product", "name price stock images")
      .populate("items.seller", "name email phone")
      .populate("user", "name email")
       .populate("items.quantity")
        const categorydata=await Category.find()
    // console.log("sellerOrders:" + sellerOrders)
    // console.log("qnty:"+sellerOrders.items);
    
    const totalorder = sellerOrders.length;
    const sellerproduct = await Product.find({ seller: sellerID })
    const totalproduct = sellerproduct.length
    // console.log("sellerproduct:" + sellerproduct)
    res.render('seller/sellerprofile',{seller:req.session.seller,products:totalproduct,datas:sellerproduct,orders:sellerOrders,totalorder:totalorder,categorys:categorydata})


  } catch (error) {
    console.error("eroor on fetching seller datas on order:" + error)
  }


});



router.post('/profile', upload.array("productImages[]", 10), async (req, res) => {
  let { name, description, price, stock, category } = req.body;
  const sellerID = req.session.seller.id;
console.log(req.body);
console.log("category"+category);

  // console.log("Fetched Seller ID:", sellerID);
  // console.log(req.files);
  // console.log(req.body)
  const images = req.files.map(file => "/uploads/products/" + file.filename);
 
  try {
    await Product.create({
      name: name,
      description: description,
      price: price,
      stock: stock,
      seller: sellerID,
      category:category,
      images: images

    })
    console.log('the data saved in database');
    return res.redirect('/seller/profile')

  } catch (error) {
    console.error("data not saved in data base:" + error)
  }


})

router.get('/profile/update', sellerauth, async (req, res) => {
  let id = req.query.id
  console.log("id:" + id);
  let data = await Product.findById(id)
  console.log(data);


  res.render('seller/seller_update', { product: data })
})

router.post("/profile/update/:id", async (req, res) => {
  let id = req.params.id
  console.log("id:" + id);
  console.log(req.body);

  let { name, description, price, stock } = req.body



  try {
    await Product.findByIdAndUpdate(id, {
      name,
      description,
      price,
      stock
      // category:category
    })
    res.redirect('/seller/profile')
  } catch (error) {
    console.error(error);
    console.log("data not updated");
    console.log(req.query);


  }
})


router.get('/product/delete/:id', sellerauth, async (req, res) => {
  let id = req.params.id
  try {
    await Product.findByIdAndDelete(id)
    console.log("data deleted success fully");
    return res.redirect('/seller/profile')

  } catch (error) {
    console.error(error)
  }
})

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