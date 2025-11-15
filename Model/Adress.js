const mongoose=require('mongoose')


let addressSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Usercol",
        require:[true,"user is required"]
    },
    // Address: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: "India",required: true },
    // },



    
})
module.exports=mongoose.model('Address',addressSchema)