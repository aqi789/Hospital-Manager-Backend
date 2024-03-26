const mongoose=require("mongoose")

const departmentHeadSchema=mongoose.Schema({
    name:String,
    number:Number, 
    age:Number,
    image:String,
    description:String,
    department:String
})
const departmentHeadModel=mongoose.model("head", departmentHeadSchema);
module.exports=departmentHeadModel;
