const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const session = require("express-session");
const mongostore = require("connect-mongo");
const mongoose=require('mongoose')
const Products = require("../Model/Product");
const Category = require("../Model/Category");
const user = require("../Model/user");
const Cart = require("../Model/Cart");
const Wishlist = require("../Model/wishlist");
const Order = require("../Model/Order");
const Address = require("../Model/Adress");
const Contact = require("../Model/contact");
const hbs = require("hbs");
const { any } = require("../multer/multer");
const userrauth=require('../middleware/userauth');
let passport=require('passport')
require("../config/userpassport")(passport); 


hbs.registerHelper("multiply", function (a, b) {
    return a * b;
});

hbs.registerHelper("sum", function (a, b) {
    return a + b;
});
hbs.registerHelper("subtract", function(a, b) {
    return a - b;
});


hbs.registerHelper("times", function(n, block) {
    let accum = "";
    for (let i = 0; i < n; ++i) {
        accum += block.fn(i);
    }
    return accum;
});
hbs.registerHelper("arrayify", function(value) {
  return Array.isArray(value) ? value : [value];
});

hbs.handlebars.registerHelper("substr", function (text, start, length) {
    if (!text) return "";
    return text.substring(start, start + length);
});

hbs.handlebars.registerHelper("truncate", function (text, length) {
  if (!text) return "";
  return text.length > length ? text.substring(0, length) + "..." : text;
});
hbs.handlebars.registerHelper("eq", function (a, b) {
    return a == b;
});


hbs.registerHelper("uppercase", function (str) {
  return str.toUpperCase();
});

hbs.handlebars.registerHelper("formatDate", function (date, format) {
    if (!date) return "";

    const d = new Date(date);

    if (!format || format === "default") {
        return d.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    switch (format) {
        case "dd-mm-yyyy":
            return d.toLocaleDateString("en-GB");
        case "yyyy-mm-dd":
            return d.toISOString().split("T")[0];
        case "full":
            return d.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            });
        default:
            return d;
    }
});



hbs.registerHelper("eq", function(a, b) {
  return a === b;
});



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
        secure: false,
    }
}));

router.use(passport.initialize());
router.use(passport.session());

router.get("/register", (req, res) => {
    res.render("user/register");
});

router.post("/register", async (req, res) => {
    let hashed = await bcrypt.hash(req.body.password, 10);//firstname set

    await user.create({
        name: req.body.firstname,
        email: req.body.email,
        phone: req.body.phone,
        password: hashed,
    });

    res.redirect("/login");
});


router.get("/login", (req, res) => {
    res.render("user/login");
});

router.post("/login", async (req, res) => {
    let data = await user.findOne({ email: req.body.email });
    if (!data) return res.redirect("/login");

    let matched = await bcrypt.compare(req.body.password, data.password);
    if (!matched) return res.redirect("/login");

    req.session.user = {
        userid: data._id,
        email: data.email,
        username: data.firstname
    };

    res.redirect("/");
});


router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {

      const googleUser = req.user;
   
      if (!googleUser.isNewGoogleUser) {
        req.session.user = {
          userid: googleUser._id.toString(),
          name: googleUser.name,
          email: googleUser.email,
          phone: googleUser.phone
        };
        return res.redirect("/profile");
      }

      // 2️⃣ New Google user → save in MongoDB
      const newUser = await user.create({
        googleId: googleUser.googleId,
        name: googleUser.name,
        email: googleUser.email,
        phone: googleUser.phone,
        password: null, // Google users don't have password
      });

      req.session.user = {
        userid: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email
      };

      return res.redirect("/profile");
  }
);


router.get("/profile",userrauth, async (req, res) => {

    const userid = req.session.user.userid;

    let orders = await Order.find({ user: userid })
    .populate({
        path: "items.product",
        select: "name images price"
    })
    .lean();
    console.log(orders);
    

    
    
    let data = await user.findById(userid).lean();

    const wishlist = await Wishlist.findOne({ user: userid }).populate("items.product").lean();

    const items = wishlist ? wishlist.items : [];

    const cart = await Cart.findOne({ user: userid }).lean();
    const cartCount = cart ? cart.items.length : 0;

    res.render("user/profile", {
        data,
        items,
        cartCount,orders,userId: userid
    });
});


router.post("/profile", async (req, res) => {
    await user.findByIdAndUpdate(req.session.user.userid, {
        name: req.body.firstname,
        email: req.body.email,
        phone: req.body.phone
    });

    res.redirect("/profile");
});
router.get("/notifications", (req, res) => {
    res.render("user/notifications");
});

router.get("/", async (req, res) => {
    const categories = await Category.find();
    const topOffers = await Products.find().skip(0).limit(4).populate("category");
    const topPicks = await Products.find().skip(4).limit(4).populate("category");
    const dealsOfDay = await Products.find().skip(8).limit(4).populate("category");
    res.render("user/homepage", {user,categories,topOffers,dealsOfDay,topPicks});
});


router.post("/", async (req, res) => {
    let search = (req.body.search || "").trim();

    if (!search) {
        return res.redirect("/");
    }
    let matchedProducts = await Products.find({
        name: { $regex: search, $options: "i" }
    }).populate("category");

    const categories = await Category.find();

    if (matchedProducts.length === 0) {
        return res.render("user/usercategorypage", {
            data: [],
            categories,
            message: "No products found for '" + search + "'",
            search
        });
    }
    res.render("user/usercategorypage", {
        data: matchedProducts,
        categories,
        search
    });
});

router.get("/contact",(req,res)=>{
    res.render("user/contact")
})


router.post("/contact",async (req, res) => {

    const { name, email, subject, message } = req.body;


    if (!name || !email || !message) {
      return res.redirect("/contact?error=1");
    }


    const userId = req.session?.user?.userid || req.session?.user?.id || null;

    await Contact.create({
      fullName: name,
      email,
      subject: subject || "Other",
      message,
      user: userId
    });

    return res.redirect("/");
});



router.get("/allproducts", async (req, res) => {
    const { brand, price } = req.query;  
    const page = Number(req.query.page) || 1;
    const perPage = 3;

    let filter = {};


    if (brand) {
        filter.category = { $in: Array.isArray(brand) ? brand : [brand] };
    }
    if (price && Number(price) > 0) {
        filter.price = { $lte: Number(price) };
    }

    const totalProducts = await Products.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / perPage);

    const data = await Products.find(filter)
        .skip((page - 1) * perPage)
        .limit(perPage)
        .populate("category");

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    res.render("user/usercategorypage", {
        data,
        categories: await Category.find(),
        page,
        totalPages,
        prevPage: page > 1 ? page - 1 : null,
        nextPage: page < totalPages ? page + 1 : null,
        pages,
        brand,
        price
    });
});





router.get("/usercategorypage", async (req, res) => {
    let catName = req.query.cat;
     const categories = await Category.find();
    let category = await Category.findOne({
        name: catName
    });
    let data = [];
    if (category) {
        data = await Products.find({ category: category._id}).populate("category")
    }
    console.log(data,categories,catName);
    
    
    res.render("user/usercategorypage",{data,categories,catName});
});

router.get("/singlepage/:id", async (req, res) => {
        let id = req.params.id;
        let data = await Products.findById(id).populate("category").populate("seller").populate("review.user").lean();
        if (!data){
            res.send("Product not found");
        } 
        console.log(data);
        
        
        let related = await Products.find({category: data.category._id }).limit(3).lean();
        res.render("user/singlepage", { data, related });///related is not working
});

router.get("/cart/add/:id",userrauth, async (req, res) => {
    const userid = req.session.user.userid;
    const productId = req.params.id;
    const product = await Products.findById(productId).lean();
    let userCart = await Cart.findOne({ user: userid });
    if (!userCart) {
        userCart = await Cart.create({
            user: userid,
            items: [{
                product: productId,
                quantity: 1,
                priceAtAddTime: product.price
            }],
            totalPrice: product.price
        });
        res.redirect("/cart")
    } else{
        let itemcheck=userCart.items.find(i=>i.product.toString()===productId)
        if(itemcheck){
            itemcheck.quantity+=1
        }else{
            userCart.items.push({
                    product:productId,
                    quantity:1,
                    priceAtAddTime:product.price
            })
        }
        userCart.totalPrice=userCart.items.reduce((sum,item)=>{
            return sum+(item.quantity*item.priceAtAddTime)
        },0)
        await userCart.save()
         res.redirect("/cart");
    }
});
router.get("/cart/remove/:id",userrauth,async(req,res)=>{
    let productid=req.params.id
    let userid=req.session.user.userid
    await Cart.findOneAndUpdate({user:userid},{$pull:{items:{product:productid}}})
    res.redirect("/cart")
})

router.get("/cart",userrauth, async (req, res) => {
    const userid = req.session.user.userid;

   const userCart = await Cart.findOne({ user: userid }).populate({path: "items.product",populate: {path: "seller"}});
    if (!userCart) {
        return res.render("user/cart", { items: [], totalPrice: 0 });
    }

    res.render("user/cart", {
        items: userCart.items,
        totalPrice: userCart.totalPrice
    });
});
router.get("/wishlist/add/:id",userrauth, async (req, res) => {
        const userid = req.session.user.userid;
        const productId = req.params.id;

        let wishlist = await Wishlist.findOne({ user: userid });

        if (!wishlist) {
            wishlist = await Wishlist.create({
                user: userid,
                items: [{ product: productId }]
            });
        } else {
            const exists = wishlist.items.some(
                item => item.product.toString() === productId
            );
            if (!exists) {
                wishlist.items.push({ product: productId });
                await wishlist.save();
            }
        }
        
        res.redirect("/profile");
});
router.get("/wishlist/remove/:id",userrauth, async (req, res) => {
        const userid = req.session.user.userid;
        const productId = req.params.id;

        await Wishlist.updateOne(
            { user: userid },
            { $pull: { items: { product: productId } } }
        );
        res.redirect("/profile");
});
router.get("/order/:id",userrauth, async (req, res) => {
        const userid = req.session.user.userid;
        const productId = req.params.id;

        let data = await Products.findById(productId).lean();
        let address = await Address.findOne({ user: userid }).lean();
        res.render("user/order", {
            data,
            address
        });
});

router.post("/order/:id", async (req, res) => {
        const userid = req.session.user.userid;
        let exists = await Address.findOne({ user: userid });

        if (exists) {
            await Address.updateOne(
                { user: userid },
                { address: req.body.address }
            );
        } else {
            await Address.create({
                user: userid,
                address: req.body.address
            });
        }

        res.redirect("/order/" + req.params.id);
});


router.get("/placeorder/:id", userrauth, async (req, res) => {
        const userid = req.session.user.userid;
        const productid = req.params.id;
        const quantity = parseInt(req.query.qty) || 1;

        const productdata = await Products.findById(productid).populate("seller");
        const { notifySellerFor } = require("../websocket/sellerws");

        if (productdata.stock < quantity) {
            return res.send("Not enough stock available!");
        }

        let orderdata = await Order.findOne({ user: userid });

        // Extract seller ID correctly
        let sellerId = productdata.seller._id || productdata.seller;

        // DEBUG LOG — very important
        console.log("SELLER WHO SHOULD RECEIVE:", sellerId);


            let newOrder = await Order.create({
                user: userid,
                items: [
                    {
                        product: productid,
                        quantity: quantity,
                        priceAtPurchase: productdata.price,
                        seller: sellerId
                    }
                ],
                totalPrice: productdata.price * quantity
            });
         productdata.stock = productdata.stock - quantity;
        if (productdata.stock < 0) productdata.stock = 0;
        await productdata.save();

            // Notify ONLY that seller
 notifySellerFor({
    sellerId: sellerId.toString(),
    type: "new_order",
    orderId:orderdata._id,
    total: productdata.price,
});



            return res.redirect("/ordersuccess");
});

router.get("/ordersuccess", userrauth, async (req, res) => {
 
    const userid = req.session.user.userid;
    let address=await Address.findOne({user:userid})
    console.log(address);
    

    const lastOrder = await Order.findOne({ user: userid }).populate("items.product").populate("items.seller");
   
    const lastitem=lastOrder.items[lastOrder.items.length-1]
    res.render("user/ordersuccess", {
      order: lastitem,address
    });
});
router.get("/cartorder", userrauth,async (req, res) => {
 
    const userid = req.session.user?.userid;
    if (!userid) return res.redirect("/login");

   
    const cart = await Cart.findOne({ user: userid })
      .populate("items.product")
      .lean();


    const address = await Address.findOne({ user: userid }).lean();

    if (!cart) {
      return res.render("user/cartorder", {
        cartdata: [],
        total: 0,
        address
      });
    }

   
    const cartdata = cart.items.map((item) => ({
      _id: item.product._id,
      name: item.product.name,
      images: item.product.images,
      price: item.priceAtAddTime,
      quantity: item.quantity
    }));

    res.render("user/cartorder", {
      cartdata,
      address,
      total: cart.totalPrice
    });
});
router.post("/cartorder", async (req, res) => {
        const userid = req.session.user.userid;
        let exists = await Address.findOne({ user: userid });
        if (exists) {
            await Address.updateOne(
                { user: userid },
                { address: req.body.address }
            );
        } else {
            await Address.create({
                user: userid,
                address: req.body.address
            });
        }

        res.redirect("/cartorder");
});
router.get("/placemultiorder",userrauth, async (req, res) => {
  
        const userId = req.session.user.userid;
        const cart = await Cart.findOne({ user: userId })
            .populate("items.product");

        if (!cart || cart.items.length === 0) {
            return res.redirect("/cart");
        }

      
        const orderItems = cart.items.map(item => ({
            product: item.product._id,
            quantity: item.quantity,
            priceAtPurchase: item.priceAtAddTime,
            seller: item.product.seller
        }));

       
        const totalAmount = orderItems.reduce(
            (sum, item) => sum + item.quantity * item.priceAtPurchase,
            0
        );

          let savedOrder = await Order.create({
                user: userId,
                items: orderItems,
                totalPrice: totalAmount
            });
        
        for (let item of cart.items) {
        const product = item.product;

        product.stock-=item.quantity; 

        if (product.stock < 0) product.stock = 0;      

        await product.save();
    }


        return res.redirect("/multipleordersuccess");
});
router.get("/multipleordersuccess",userrauth, async (req, res) => {
   
        const userId = req.session.user.userid;

        let cart = await Cart.findOne({ user: userId })
            .populate("items.product")
            .lean();

        if (!cart) return res.redirect("/cart");

 
        const address = await Address.findOne({ user: userId }).lean();

        res.render("user/multipleordersuccess", {
            order: cart,
            address
        });
        process.nextTick(async () => {
                const userCart = await Cart.findOne({ user: userId });

                if (userCart) {
                    userCart.items = [];
                    userCart.totalPrice = 0;
                    await userCart.save();
                }
        });
});







router.get("/review/:id", async (req, res) => {

        let productId = req.params.id;
        let product = await Products.findById(productId).populate("review.user").lean();
        res.render("user/review", { product });
});
router.post("/review/:id", async (req, res) => {
        const productId = req.params.id;
        if (!req.session.user) {
            return res.redirect("/login");
        }
        let product = await Products.findById(productId)

        product.review.push({
            user: req.session.user.userid,
            rating:req.body.rating,
            content:req.body.content,
            content_typing:req.body.content_typing
        });
        await product.save();
        res.redirect(`/review/${productId}`);
});


router.get("/logout",async(req,res)=>{
    req.session.destroy(()=>{
        res.redirect("/login")
    })
})

module.exports = router;
