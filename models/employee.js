const mongoose=require("mongoose");

const employeeSchema=mongoose.Schema({
    name:String,
    number:String, 
    age:Number,
    image:String,
    description:String,
    department:String,
    report:String
});

const employeeModel=mongoose.model("employee", employeeSchema);
module.exports=employeeModel;