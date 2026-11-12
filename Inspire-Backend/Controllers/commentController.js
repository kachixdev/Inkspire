import Comment from "../Models/Comment.js";
import User from "../Models/User.js";

const createComment = async (req, res) => {
    try {
        let { text , post} = req.body
        if (!text || !post ) return res.status(400).json({ message: "please fill all the fields" })
       const comment =  await Comment.create({ text, author: req.user.id, post })
        await User.findByIdAndUpdate(req.user.id, { $push: { comments: comment._id } })
        await comment.populate("author", "firstName lastName")
        res.status(201).json(comment)
    } catch (error) {
        res.status(500).json({ message: "something went wrong" })
        console.log(error)
    }
}

const getAllComments = async (req, res) => {
    try {
        let comments = await Comment.find().populate("author", "firstName lastName image")
        if (!comments) return res.status(404).json({ message: "no comments found" })
        res.status(200).json(comments)
    } catch (error) {
        res.status(500).json({ message: "something went wrong" })
        console.log(error)
    }
}

const getCommentsByPost = async (req, res) => {
    try {
        const comments = await Comment.find({ post: req.params.postId })
            .populate("author", "firstName lastName image")
            .sort({ createdAt: 1 })
        res.status(200).json(comments)
    } catch (error) {
        res.status(500).json({ message: "something went wrong" })
        console.log(error)
    }
}

const getMyComments = async (req, res) => {
    try {
        const comments = await Comment.find({ author: req.user.id })
            .populate("author", "firstName lastName image")
            .populate("post", "title")
            .sort({ createdAt: -1 })
        res.status(200).json(comments)
    } catch (error) {
        res.status(500).json({ message: "something went wrong" })
        console.log(error)
    }
}

const getOneComment = async (req, res) => {
    try {
        let { postId } = req.params
        let comment = await Comment.findById(postId)
        if (!comment) return res.status(404).json({ message: "comment not found" })
        res.status(200).json(comment)
    } catch (error) {
        res.status(500).json({ message: "something went wrong" })
        console.log(error)
    }
}

const deleteComment = async (req, res) => {
    try {
        let { id } = req.params
        let comment = await Comment.findById(id)
        if (!comment) return res.status(404).json({ message: "comment not found" })
        if (comment.author.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "you can only delete your own comments" })
        }

        await User.findByIdAndUpdate(comment.author, { $pull: { comments: comment._id } })
        await comment.deleteOne()
        res.status(200).json({ message: "comment deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: "something went wrong" })
        console.log(error)
    }
}
export { createComment, getAllComments, getCommentsByPost, getMyComments, getOneComment, deleteComment }
