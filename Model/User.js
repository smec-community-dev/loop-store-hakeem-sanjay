const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, "Please add your full name"],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
    },

    role: {
        type: String,
        enum: ["user", "seller", "admin"],
        default: "user",
        required:true
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    // Simple approval tracking (optional)
    approvedAt: {
        type: Date
    }
}, { timestamps: true })

module.exports = mongoose.model('User', UserSchema)
