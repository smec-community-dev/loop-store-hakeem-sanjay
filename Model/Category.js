
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a category name"],
      unique: true,
      trim: true,
    },
    description: {
      type: String
    },
    image: {
      type: String, 
      trim: true,
    },
    // status: {
    //   type: String,
    //   enum: ["active", "inactive"],
    //   default: "active",
    // },
    // createdBy: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User", //seller who created the category
    // },
  },
  { timestamps: true }
);
                      
module.exports = mongoose.model("Category", categorySchema);
