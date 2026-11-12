import Post from "../Models/Post.js";
import Comment from "../Models/Comment.js";
import User from "../Models/User.js";

const createPost = async (req, res) => {
    try {
        let { title, snippet, content } = req.body
        if (!title || !snippet || !content) {
            return res.status(400).json({ message: "please fill all the fields" })
        }
        const newPost = await Post.create({ title, snippet, content, author: req.user.id })
        await User.findByIdAndUpdate(req.user.id, { $push: { posts: newPost._id } })
        res.status(201).json({ message: "post created successfully" })

    } catch (error) {

        res.status(500).json({ message: "something went wrong" })

        console.log(error)
    }
}

const getAllPosts = async (_, res) => {
    try {
        let posts = await Post.find().populate("author", "firstName lastName image")
        if (!posts) return res.status(404).json({ message: "no posts found" })
        res.status(200).json(posts)
    } catch (error) {
        res.status(500).json({ message: "something went wrong" })
        console.log(error)
    }
}

const getOnePost = async (req, res) => {
    try {
        let { id } = req.params
        let post = await Post.findById(id)
        if (!post) return res.status(404).json({ message: "post not found" })
        res.status(200).json(post)
    } catch (error) {
        res.status(500).json({ message: "something went wrong" })
        console.log(error)
    }
}

const updatePost = async (req, res) => {
    try {
        let { id } = req.params
        let post = await Post.findByIdAndUpdate(id, req.body, { returnDocument: 'after' })
        if (!post) return res.status(404).json({ message: "post not found" })
        res.status(200).json({ message: "post updated successfully" })
    } catch (error) {
        res.status(500).json({ message: "something went wrong" })
        console.log(error)
    }
}
const deletePost = async (req, res) => {
    try {
        let { id } = req.params
        let post = await Post.findById(id)
        if (!post) return res.status(404).json({ message: "post not found" })
        if (post.author.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "you can only delete your own posts" })
        }

        const comments = await Comment.find({ post: id }).select("_id")
        const commentIds = comments.map((comment) => comment._id)
        await Comment.deleteMany({ post: id })
        await User.updateMany(
            { comments: { $in: commentIds } },
            { $pull: { comments: { $in: commentIds } } }
        )
        await User.findByIdAndUpdate(post.author, { $pull: { posts: post._id } })
        await post.deleteOne()
        res.status(200).json({ message: "post deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: "something went wrong" })
        console.log(error)
    }
}

export { createPost, getAllPosts , updatePost , getOnePost , deletePost }
