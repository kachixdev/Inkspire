import mongoose from "mongoose";

const schema = mongoose.Schema;

const postSchema = new schema({
    title: {
        type:String,
        required:true
    },
    snippet:{
        type:String,
        required:true
    },
    content:{
        type:String,
        required:true
    },
    author:{
        type: mongoose.Types.ObjectId,
        ref: "User",
        required:true
    }
    
},{timestamps:true});

const post = mongoose.model("Post", postSchema);


export default post;