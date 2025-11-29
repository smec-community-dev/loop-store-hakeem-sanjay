const express = require('express');
const session = require('express-session');
let hbs = require('hbs');
const dotenv = require('dotenv').config();
const bcrypt = require('bcrypt');
const User = require('../Model/user');
let Seller = require('../Model/Seller');
const Admin = require('../Model/Admin');
const adminauth = require('../middleware/adminauth');
const router = express.Router();
const Category = require('../Model/Category');
const Order = require('../Model/Order');

const uploadCategory = require("../middleware/uploadCategoryS3");   // ✅ NEW S3 UPLOADER


hbs.registerHelper("inc", (value) => {
    return parseInt(value) + 1;
});


router.use(session({
    secret: "ADMIN@123",
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60
    }
}));


// LOGIN
router.get('/login', (req, res) => {
    res.render('admin/adminlogin');
});


router.post('/login', async (req, res) => {
    let { email, password } = req.body;

    let find = await Admin.findOne({ email });
    if (!find) return res.redirect('/admin/login');

    let match = await bcrypt.compare(password, find.password);
    if (!match) return res.redirect('/admin/login');

    req.session.adminEmail = email;
    res.redirect('/admin/profile');
});


// ADMIN PROFILE
router.get('/profile', adminauth, async (req, res) => {
    let userdata = await User.find();
    let sellerdata = await Seller.find().populate('products');
    let categoryy = await Category.find();
    const orders = await Order.find();

    res.render('admin/adminprofile', {
        usercount: userdata.length,
        sellercount: sellerdata.length,
        totalorder: orders.length,
        seller: sellerdata,
        user: userdata,
        category: categoryy,
        categorycount: categoryy.length
    });
});


// ⚠️ CATEGORY ADD — NOW USING S3 UPLOAD
router.post('/category/add', uploadCategory.single("image"), async (req, res) => {
    let { name, description } = req.body;

    try {
        await Category.create({
            name,
            description,
            image: req.file.location   // S3 URL
        });

        return res.redirect("/admin/profile");
    } catch (error) {
        console.error(error);
        res.send("Error adding category");
    }
});


// DELETE CATEGORY (FIXED ROUTE)
router.post('/category/delete/:id', async (req, res) => {
    const id = req.params.id;

    try {
        await Category.findByIdAndDelete(id);
        console.log("Category deleted");
        return res.redirect('/admin/profile');
    } catch (error) {
        console.error(error);
        return res.send("Error deleting category");
    }
});



module.exports = router;
