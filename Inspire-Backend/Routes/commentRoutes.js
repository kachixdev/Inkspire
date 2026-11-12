import { Router } from "express";
import { createComment, getAllComments, getCommentsByPost, getMyComments, getOneComment, deleteComment } from "../Controllers/commentController.js";
import authorize from "../middleWares/authorize.js";


const router = Router()

router.post('/', authorize(["admin","user"]), createComment)
router.get('/getallcomments',authorize(["admin"]) , getAllComments)
router.get('/mine', authorize(["admin", "user"]), getMyComments)
router.get('/post/:postId', getCommentsByPost)
router.get('/:id', getOneComment)
router.delete('/:id', authorize(["admin", "user"]), deleteComment)

export default router
