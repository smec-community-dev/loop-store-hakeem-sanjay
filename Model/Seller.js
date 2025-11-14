const mongoose = require('mongoose')



let sellerSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
   //     required: [true, "there mustbe a seller"]
    },
    name: {
        type: String,
        required: true,
    }, email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        trim: true
    }, password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6
    },
    seller_discription: {
        type: String,
        required: true,
    },
     phone: {
        type: Number,
        required: true
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
   //     required: [true, "Cart item must reference a product"]
    }],
    location: {
        type: String,
        required: true,

    }, totalSales: {
        type: Number,
        default: 0
    },
})




module.exports = mongoose.model('Seller', sellerSchema,"Seller")