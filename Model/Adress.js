const mongoose = require('mongoose')

let addressSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "user is required"]
    },

    address: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        house: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true }
    },

}, { timestamps: true });

module.exports = mongoose.model("Address", addressSchema);
