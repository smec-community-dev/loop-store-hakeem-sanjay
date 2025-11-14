const mongoose = require("mongoose");


const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: [true, "please add dis"],

  },
   stock: { 
    type: Number,
     required: true,
      default: 0 
    }, // ✅ track stock
  price: {
    type: Number,
    required: [true, "Please add a price"],
  }, images: [
    {
       type: String,  // storing image URL/path
      required: true
    },
  ], category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
   // required: [true, "Please select a category"],
  }, seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    //required: true
  },
  review: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
       // required: [true, "Please select a user"],
      },
      content: {
        type: String,
      },
      rating: { type: Number, min: 1, max: 5 },

    }
  ],// ✅ Flexible specifications (store any key:value data)
  
}, { timestamps: true })


module.exports =mongoose.model("Product", productSchema);




// specifications: {
//     type: Map,
//     of: mongoose.Schema.Types.Mixed, // can hold strings, numbers, arrays, objects
//     default: {},
//   },