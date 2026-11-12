import mongoose from "mongoose";
const schema = mongoose.Schema;

const commentSchema = schema({
    text:{
        type: String,
        required:true
    },
    author:{
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    post:{
        type: mongoose.Types.ObjectId,
        ref: "Post",
        required: true
    }
},{timestamps:true});
const Comment = mongoose.model("Comment", commentSchema);   
export default Comment;