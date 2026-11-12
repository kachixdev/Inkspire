import { Router } from "express";
import { createPost, deletePost, getAllPosts, getOnePost, updatePost } from "../Controllers/postController.js";
import authorize from "../middleWares/authorize.js";

const router = Router()
router.post('/', authorize(["admin","user"]) ,createPost)
router.get('/getallpost' ,getAllPosts )
router.get('/:id', getOnePost)
router.patch('/:id',updatePost)
router.delete('/:id', authorize(["admin", "user"]), deletePost)

export default router 