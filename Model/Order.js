const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Order must belong to a user"],
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Order item must reference a product"],
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, "Quantity cannot be less than 1"],
        },
        priceAtPurchase: {
          type: Number,
          required: true,
        },
      },
    ],

    
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);



// shippingAddress: {
  //       fullName: { type: String, required: true },
  //       phone: { type: String, required: true },
  //       addressLine1: { type: String, required: true },
  //       addressLine2: { type: String },
  //       city: { type: String, required: true },
  //       state: { type: String, required: true },
  //       postalCode: { type: String, required: true },
  //       country: { type: String, default: "India" },
  
      // paymentMethod: {
      //   type: String,
      //   enum: ["Razorpay", "COD", "Stripe", "PayPal"],
      //   default: "COD",
      // },

      // paymentStatus: {
      //   type: String,
      //   enum: ["Pending", "Paid", "Failed", "Refunded"],
      //   default: "Pending",
      // },
  
//     },