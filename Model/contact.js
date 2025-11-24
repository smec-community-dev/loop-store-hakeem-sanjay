const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },

    subject: {
        type: String,
        required: true,
        enum: ["Order", "Refund", "Other"], // 👈 matches your form
        default: "Other"
    },

    message: {
        type: String,
        required: true,
        trim: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        default: null
    }

}, { timestamps: true }); // adds createdAt, updatedAt

module.exports = mongoose.model("contact", contactSchema);
