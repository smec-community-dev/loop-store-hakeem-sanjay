const mongoose = require("mongoose")

let userschema = new mongoose.Schema({

    firstname: {
        type: String,
        trim: true,
        required: [true, "Please add your full name"],
    },

    username: {
        type: String,
        trim: true,
        required: [true, "Please add your Username"],
        unique: true,
        minlength: [3, "Username must be at least 3 characters"]
    },

    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"]
    },

    phone: {
        type: Number,
        trim: true,
        required: [true, "Phone number is required"],
        match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"]
    },

    role: {
        type: String,
        enum: ["user", "seller", "admin"],
        default: "user",
    },

    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [6, "Password must be at least 6 characters long"]
    },

    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "approved"
    },
    approvedAt: {
        type: Date
    }

}, { timestamps: true });

let usermodel=mongoose.model("usercol",userschema,"usercol")

module.exports=usermodel