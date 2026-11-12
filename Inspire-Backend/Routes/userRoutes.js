import { Router } from "express";
import { createUser, getAllUsers, getOneUser , updateUser, updateProfile, deleteUser, login, forgotPassword, resetPassword } from "../Controllers/userController.js";
import authorize from "../middleWares/authorize.js";
import { handleAvatarUpload } from "../middleWares/avatarUpload.js";

const router = Router()

router.post('/signup', createUser)
router.post('/login', login)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.patch('/profile', authorize(["admin", "user"]), handleAvatarUpload, updateProfile)
router.get('/getallusers', authorize(["admin"]), getAllUsers)
router.get('/:id', getOneUser)
router.patch('/:id', authorize(["admin"]) , updateUser)
router.delete('/:id', authorize(["admin"]) ,deleteUser)

export default router