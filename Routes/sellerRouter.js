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
let passport=require('passport')
require("../config/sellerpassport")(passport);   
const Notification = require("../Model/sellerNotification");



const router = express.Router()
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

const cookieParser = require('cookie-parser')
const session = require('express-session')
const MongoStore = require('connect-mongo')
router.use('/uploads', express.static(path.join(__dirname, 'uploads')));



router.use(cookieParser());

router.use(
  session({
    secret: "Hakeem@123",  
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: "mongodb://localhost:27017/LiveProject",
      collectionName: "seller_sessions",
      ttl: 24 * 60 * 60,
    }),
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

router.use(passport.initialize());
router.use(passport.session());


hbs.registerHelper("times", function(n, block) {
    let accum = "";
    for (let i = 0; i < n; ++i) {
        accum += block.fn(i);
    }
    return accum;
});

hbs.registerHelper("eq", (a, b) => a === b);




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

    return res.redirect('/seller/login');
  }
  let match = await bcrypt.compare(password, data.password)
  if (!match) {
    console.log("the given password is Wrong");

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
  let sellerdata = await Seller.findById(sellerID);

  try {

    const sellerOrders = await Order.find({
      "items.seller": sellerID
    })
      .populate("items.product", "name price stock images seller")
      .populate("items.seller", "name email phone")
      .populate("user", "name email");

    // Filter items belonging to this seller
    const finalOrders = sellerOrders
      .map(order => {
        const matchedItems = order.items.filter(item =>
          item.product &&
          item.product.seller &&
          item.product.seller.toString() === sellerID.toString()
        );
        order.items = matchedItems;
        return order;
      })
      .filter(order => order.items.length > 0);

    // Total products sold
    let totalProductsOrdered = 0;
    finalOrders.forEach(order => {
      totalProductsOrdered += order.items.length;
    });

    // Total revenue
    let totalPrice = 0;
    finalOrders.forEach(order => {
      order.items.forEach(item => {
        totalPrice += item.quantity * item.product.price;
      });
    });

    const categorydata = await Category.find();

    const sellerproduct = await Product.find({ seller: sellerID })
      .populate("review")
      .populate("review.user");

    const totalproduct = sellerproduct.length;

    return res.render("seller/sellerprofile", {
      seller: sellerdata,
      sellerId: req.session.seller.id,
      products: totalproduct,
      datas: sellerproduct,
      orders: finalOrders,   
      totalorder: totalProductsOrdered,
      categorys: categorydata,
      total: totalPrice
    });

  } catch (error) {
    console.error("eroor on fetching seller datas on order:" + error)
  }
});
router.get("/orderupdate", async (req, res) => {
  try {
    const orderId = req.query.id;
    const newStatus = req.query.status;

    if (!orderId || !newStatus) {
      return res.status(400).send("Missing parameters");
    }


    let updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: newStatus },
      { new: true }
    ).populate("user");

    if (!updatedOrder) {
      return res.status(404).send("Order not found");
    }

    const userId = updatedOrder.user._id.toString();

    const { notifyUserFor } = require("../websocket/sellerws");

    notifyUserFor(userId, {
      type: "order_status_update",
      orderId,
      status: newStatus
    });

    if (newStatus === "Cancelled") {
      await Order.findByIdAndDelete(orderId);
    }

    return res.redirect("/seller/profile");

  } catch (error) {
    console.error("Order update error:", error);
    res.status(500).send("Server Error");
  }
});



router.post('/profile', upload.array("productImages[]", 10), async (req, res) => {
    let { name, description, price, stock, category } = req.body;
    const sellerID = req.session.seller.id;

    const images = req.files.map(file => "/uploads/products/" + file.filename);

    try {
        let newProduct = await Product.create({
            name,
            description,
            price,
            stock,
            seller: sellerID,
            category,
            images
        });

        await Seller.findByIdAndUpdate(
            sellerID,
            { $push: { products: newProduct._id } }
        );

        console.log("Product created");


        return res.redirect('/seller/profile');

    } catch (error) {
        console.error("Product save error:", error);
    }
});

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
router.get('/order/details/:id', async (req, res) => {
  try {
    const sellerID = req.session.seller.id;

    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.product", "name price images seller");

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Filter only this seller's items
    const sellerItems = order.items.filter(item =>
      item.product &&
      item.product.seller &&
      item.product.seller.toString() === sellerID.toString()
    );

    const filteredOrder = {
      _id: order._id,
      user: order.user,
      createdAt: order.createdAt,
      items: sellerItems,
      totalPrice: sellerItems.reduce(
        (sum, item) => sum + (item.quantity * item.product.price),
        0
      )
    };

    res.json({ success: true, order: filteredOrder });

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error fetching order" });
  }
});


router.get('/auth/google',
  passport.authenticate('google-seller', { scope: ['profile', 'email'] })
);

router.get("/auth/google/callback",passport.authenticate("google-seller", { failureRedirect: "/seller/login" }),
  async (req, res) => {

    try {
      const user = req.user;

      // 1️⃣ If seller already exists → direct login
      if (!user.isNewGoogleUser) {
        req.session.seller = {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone
        };
        return res.redirect("/seller/profile");
      }

      // 2️⃣ New Google seller → create seller directly without form
      const newSeller = await Seller.create({
        googleId: user.googleId,
        name: user.name,
        email: user.email,
        photo: user.photo,
        phone: 999888777,              // default phone OR set null
        location: "Not Provided",      // default location
        seller_discription: "No description yet",
      });

      req.session.seller = {
        id: newSeller._id.toString(),
        name: newSeller.name,
        email: newSeller.email,
      };

      return res.redirect("/seller/profile");

    } catch (err) {
      console.log("OAuth Auto Registration Error:", err);
      return res.redirect("/seller/login");
    }
  }
);

router.post('/update-profile',async(req,res)=>{
  let {name,email,phone,location,seller_discription}=req.body
  let sellerID=req.session.seller.id
  try{
await Seller.findByIdAndUpdate(sellerID,{
  name,email,phone,location,seller_discription
})
console.log("updated");
return res.redirect('/seller/profile')
 
}catch(error){
  console.error(error)
}

})
router.get("/notifications", async (req, res) => {
    const sellerId = req.session.seller.id;

    const notifications = await Notification.find({ sellerId })
        .sort({ createdAt: -1 });

    res.json({ notifications });
});

router.post("/notifications/read/:id", async (req, res) => {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
});


router.get("/notifications/unread-count", async (req, res) => {
    const sellerId = req.session.seller.id;

    const count = await Notification.countDocuments({
        sellerId,
        read: false
    });

    res.json({ count });
});
router.post("/notifications/read-all", async (req, res) => {
    const sellerId = req.session.seller.id;
    await Notification.updateMany({ sellerId, read: false }, { read: true });
    res.json({ success: true });
});
router.delete("/notifications/:id", async (req, res) => {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});



module.exports = router;





