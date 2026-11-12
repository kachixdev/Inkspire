import mongoose from "mongoose";
const schema = mongoose.Schema;

const userSchema = schema({
   firstName: {
     type: String,
     required: true
   }, 
   lastName: {
     type: String,
     required: true
   },
   email: {
     type: String,
     required: true,
     unique:true
   },
   image: {
     type: String,
     default: ""
   },
   role:{
     type: String,
     enum:["user","admin"],
     default:"user"
   },
   status:{
     type: String,
     enum:["active","blocked"],
     default:"active"
   },
   password: {
     type: String,
      required: true
   },
   posts:[{
        type:mongoose.Types.ObjectId,   
        ref:"Post"
    }],
   comments:[{
        type:mongoose.Types.ObjectId,
        ref:"Comment"
   }]
    
},{timestamps:true});

const user = mongoose.model("User", userSchema);

export default user;
