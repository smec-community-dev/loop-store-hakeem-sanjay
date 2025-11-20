const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const session = require("express-session");
const mongostore = require("connect-mongo");

const Products = require("../Model/Product");
const Category = require("../Model/Category");
const user = require("../Model/user");
const Cart = require("../Model/Cart");
const Wishlist = require("../Model/wishlist");
const Order = require("../Model/Order");
const Address = require("../Model/Adress");
const hbs = require("hbs");
const { any } = require("../multer/multer");
const userrauth=require('../middleware/userauth');
const sellerauth = require("../middleware/sellerauth");



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
        cartCount,orders
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

router.get("/", async (req, res) => {
    const categories = await Category.find();
    const topOffers = await Products.find().skip(0).limit(4).populate("category");
    const dealsOfDay = await Products.find().skip(4).limit(4).populate("category");
    const topPicks = await Products.find().skip(8).limit(4).populate("category");
    res.render("user/homepage", {user,categories,topOffers,dealsOfDay,topPicks});
});


router.post("/", async (req, res) => {
    let search = req.body.search.trim().toLowerCase();
    let matchedProducts = await Products.find({
        name: { $regex: search, $options: "i" }
    })
    if (matchedProducts.length === 0) {
        return res.render("user/usercategorypage", {data: []});
    }
    res.render("user/usercategorypage", {
        data:matchedProducts
    });
});


router.get("/usercategorypage", async (req, res) => {
    let catName = req.query.cat;
    let category = await Category.findOne({
        name: catName
    });
    let data = [];
    if (category) {
        data = await Products.find({ category: category._id });
    }
    res.render("user/usercategorypage",{data});
});

router.get("/singlepage/:id", async (req, res) => {
        let id = req.params.id;
        let data = await Products.findById(id).populate("category").populate("seller").populate("review.user").lean();
        if (!data){
            res.send("Product not found");
        } 
        
        let related = await Products.find({category: data.category._id }).limit(3).lean();
        res.render("user/singlepage", { data, related });
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
    try {
        const userid = req.session.user.userid;
        const productid = req.params.id;

       
        const quantity = parseInt(req.query.qty) || 1;

        const productdata = await Products.findById(productid).populate("seller");

        let orderdata = await Order.findOne({ user: userid });

        if (!orderdata) {
           
            await Order.create({
                user: userid,
                items: [
                    {
                        product: productid,
                        quantity: quantity,  
                        priceAtPurchase: productdata.price,
                        seller: productdata.seller
                    }
                ],
                totalPrice: productdata.price * quantity
            });

            return res.redirect("/ordersuccess");
        }
        else {
            orderdata.items.push({
                product: productid,
                quantity: quantity,  
                priceAtPurchase: productdata.price,
                seller: productdata.seller
            });
        }

       
        orderdata.totalPrice = orderdata.items.reduce((sum, item) => {
            return sum + (item.quantity * item.priceAtPurchase);
        }, 0);

        await orderdata.save();

        res.redirect("/ordersuccess");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
router.get("/ordersuccess", userrauth, async (req, res) => {
  try {
    const userid = req.session.user.userid;
    let address=await Address.findOne({user:userid})
    console.log(address);
    

    const lastOrder = await Order.findOne({ user: userid }).populate("items.product").populate("items.seller");
   
    const lastitem=lastOrder.items[lastOrder.items.length-1]
    res.render("user/ordersuccess", {
      order: lastitem,address
    });

  } catch (err) {
    console.log("Order Success Error:", err);
    res.status(500).send("Something went wrong");
  }
});
router.get("/cartorder", userrauth,async (req, res) => {
  try {
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

  } catch (err) {
    console.log("Cart order error:", err);
    res.redirect("/error");
  }
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

    
        let orderData = await Order.findOne({ user: userId });

        let savedOrder;

        if (!orderData) {
         
            savedOrder = await Order.create({
                user: userId,
                items: orderItems,
                totalPrice: totalAmount
            });
        } else {
            orderItems.forEach(i => orderData.items.push(i));

            orderData.totalPrice += totalAmount;

            
            savedOrder = await orderData.save();
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
