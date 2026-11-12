import { config } from 'dotenv'
config()
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import User from "../Models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import transporter from '../utils/mailer.js'
import client from '../config/redis.js';


const isValidId = (id) => mongoose.Types.ObjectId.isValid(id)

const createUser = async (req, res) => {
    try {
        let { firstName, lastName, email, password } = req.body
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: "Please fill all the feilds" })
        }
        let checkUser = await User.findOne({ email })
        if (checkUser) return res.status(400).json({ message: "user already exist" })
        let hashedPassword = await bcrypt.hash(password, 10)
        await User.create({ firstName, lastName, email, password: hashedPassword })
        await client.del("admin-users-v2")
        res.status(201).json({ message: "signup successful" })

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Welcome Email",
            html: `
               <!DOCTYPE html>
                <html>
                <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome Email</title>
                </head>
                <body style="margin:0; padding:0; background-color:#f4f4f7; font-family:'Segoe UI', Helvetica, Arial, sans-serif;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7; padding:40px 0;">
                 <tr>
                    <td align="center">
                        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                        <tr>
                            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6); padding:40px 30px; text-align:center;">
                            <h1 style="color:#ffffff; margin:0; font-size:28px; font-weight:700;">Welcome Aboard 🎉</h1>
                            <p style="color:#e0e7ff; margin:8px 0 0; font-size:15px;">We're thrilled to have you here</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:35px 30px;">
                            <p style="font-size:16px; color:#333333; line-height:1.6; margin:0 0 24px;">Thanks for joining us! Your account has been successfully created.</p>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr><td align="center">
                                <a href="#" style="display:inline-block; background:#6366f1; color:#ffffff; text-decoration:none; font-size:16px; font-weight:600; padding:14px 32px; border-radius:8px;">Get Started →</a>
                                </td></tr>
                            </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color:#f9fafb; padding:24px 30px; text-align:center; border-top:1px solid #eee;">
                            <p style="font-size:12px; color:#bbbbbb; margin:0;">© 2026 Your Company. All rights reserved.</p>
                            </td>
                        </tr>
                        </table>
                    </td>
                 </tr>
                </table>
                </body>
                </html>
            `
        }

        transporter.sendMail(mailOptions)
            .then(info => console.log("Email sent: " + info.response))
            .catch(err => console.log("Error while sending mail", err))
   } catch (error) {
        res.status(500).json({ message: "something went wrong" })
        console.log(error);
    }
}


const getAllUsers = async (req, res) => {
    try {
        const cacheKey = "admin-users-v2";
        const cachedUsers = await client.get(cacheKey)
        if(cachedUsers){
            return res.status(200).json(JSON.parse(cachedUsers))
        }
            
        let users = await User.find().select("-password")
        await client.set(
            cacheKey,
            JSON.stringify(users),
        { 
            // delete after 60secs
            EX: 60  
        })

        if (!users) return res.status(404).json({ message: "user not found" })
        res.status(200).json(users)
    } catch (error) {
        res.status(500).json({ message: "something went wrong" })
        console.log(error)
    }
}

const getOneUser = async (req, res) => {
    try {
        let { id } = req.params
        if (!isValidId(id)) return res.status(400).json({ message: "invalid user id" })
        let user = await User.findById(id).select("-password")
        if (!user) return res.status(404).json({ message: "user not found" })
        res.status(200).json(user)
    } catch (error) {
        res.status(500).json({ message: "something went wrong" })
        console.log(error)
    }
}

const updateUser = async (req, res) => {
    try {
        let { id } = req.params
        if (!isValidId(id)) return res.status(400).json({ message: "invalid user id" })
        if (id === req.user.id) {
            return res.status(400).json({ message: "you cannot change your own role" })
        }
        const { role } = req.body
        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({ message: "role must be user or admin" })
        }
        let user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true, runValidators: true }
        ).select("-password")
        if (!user) return res.status(404).json({ message: "user not found" })
        await client.del("admin-users-v2")
        res.status(200).json({ message: "updated successfully", user })
    } catch (error) {
        res.status(500).json({ message: "something went wrong" })
        console.log(error)
    }
}

const updateProfile = async (req, res) => {
    let uploadedAvatarPath
    try {
        const user = await User.findById(req.user.id)
        if (!user) return res.status(404).json({ message: "user not found" })

        const { firstName, lastName, email, currentPassword, newPassword } = req.body
        if (firstName !== undefined) {
            if (!firstName.trim()) return res.status(400).json({ message: "first name cannot be empty" })
            user.firstName = firstName.trim()
        }
        if (lastName !== undefined) {
            if (!lastName.trim()) return res.status(400).json({ message: "last name cannot be empty" })
            user.lastName = lastName.trim()
        }
        if (email !== undefined) {
            const normalizedEmail = email.trim().toLowerCase()
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                return res.status(400).json({ message: "please enter a valid email address" })
            }
            const existingUser = await User.findOne({
                email: normalizedEmail,
                _id: { $ne: user._id }
            })
            if (existingUser) return res.status(409).json({ message: "email is already in use" })
            user.email = normalizedEmail
        }
        if (newPassword || currentPassword) {
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ message: "enter your current password and a new password" })
            }
            if (newPassword.length < 8) {
                return res.status(400).json({ message: "new password must be at least 8 characters" })
            }
            const passwordMatches = await bcrypt.compare(currentPassword, user.password)
            if (!passwordMatches) {
                return res.status(400).json({ message: "current password is incorrect" })
            }
            user.password = await bcrypt.hash(newPassword, 10)
        }

        const previousImage = user.image
        if (req.file) {
            const fileBytes = req.file.buffer
            const isJpeg = fileBytes[0] === 0xff && fileBytes[1] === 0xd8 && fileBytes[2] === 0xff
            const isPng = fileBytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
            const isWebp =
                fileBytes.toString("ascii", 0, 4) === "RIFF" &&
                fileBytes.toString("ascii", 8, 12) === "WEBP"
            const validImageType =
                (isJpeg && req.file.mimetype === "image/jpeg") ||
                (isPng && req.file.mimetype === "image/png") ||
                (isWebp && req.file.mimetype === "image/webp")
            if (!validImageType) {
                return res.status(400).json({ message: "avatar file is not a valid JPEG, PNG, or WebP image" })
            }
            const extension = isJpeg ? ".jpg" : isPng ? ".png" : ".webp"
            const avatarDirectory = path.resolve("src", "uploads", "avatars")
            await mkdir(avatarDirectory, { recursive: true })
            const fileName = `${randomUUID()}${extension}`
            uploadedAvatarPath = path.join(avatarDirectory, fileName)
            await writeFile(uploadedAvatarPath, fileBytes, { flag: "wx" })
            user.image = `/uploads/avatars/${fileName}`
        }

        await user.save()
        try {
            await client.del("admin-users-v2")
        } catch (error) {
            console.error("Could not clear the admin user cache:", error)
        }

        if (uploadedAvatarPath && previousImage?.startsWith("/uploads/avatars/")) {
            const oldImagePath = path.resolve("src", previousImage.slice(1))
            try {
                await unlink(oldImagePath)
            } catch (error) {
                if (error.code !== "ENOENT") {
                    console.error("Could not remove the previous avatar:", error)
                }
            }
        }

        const safeUser = user.toObject()
        delete safeUser.password
        res.status(200).json({ message: "profile updated successfully", user: safeUser })
    } catch (error) {
        if (uploadedAvatarPath) {
            try {
                await unlink(uploadedAvatarPath)
            } catch (cleanupError) {
                if (cleanupError.code !== "ENOENT") {
                    console.error("Could not remove the rejected avatar:", cleanupError)
                }
            }
        }
        if (error.code === 11000) {
            return res.status(409).json({ message: "email is already in use" })
        }
        res.status(500).json({ message: "something went wrong" })
        console.error(error)
    }
}

const deleteUser = async (req, res) => {
    try {
        let { id } = req.params
        if (!isValidId(id)) return res.status(400).json({ message: "invalid user id" })
        let user = await User.findByIdAndDelete(id)
        if (!user) return res.status(404).json({ message: "user not found" })
        await client.del("admin-users-v2")
        res.status(200).json({ message: "user deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: "something went wrong" })
        console.log(error)
    }
}
const login = async (req,res)=> {
    try {
        let{email, password} = req.body;
        let checkUser = await User.findOne({ email })
        if (!checkUser) return res.status(400).json({ message: " incorrect email" })
        
        let checkPassword = await bcrypt.compare(password, checkUser.password)
        if (!checkPassword) return res.status(400).json({ message: "incorrect password" })
        let token = jwt.sign({id: checkUser._id, role: checkUser.role}, process.env.SECRETKEY, {expiresIn: '1h'})

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 1000 //1 hour
        })
        const user = checkUser.toObject()
        delete user.password
        res.status(200).json({ message: "login successful", user })
    } catch (error) {
        res.status(500).json({ message: "something went wrong" })
        console.log(error)
    }
}
const forgotPassword = async (req, res) => {
    try {
        let {email} = req.body;
        let checkEmail = await User.findOne({email})
        if(!checkEmail) return res.status(400).json({message: "account does not exist"})
        let resetToken = jwt.sign({id: checkEmail._id}, process.env.RESET_SECRET, {expiresIn: '15m'})
        let resetUrl = `http://localhost:3000/reset-password/${resetToken}`

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset Request",
            html: `
                <h2>Password Reset Request</h2>
                <p>You have requested to reset your password. Please click the link below to reset it:</p>
                <a href="${resetUrl}" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                <p>This link will expire in 15 minutes.</p>
            `
        }
        transporter.sendMail(mailOptions)
            .then(info => console.log("Email sent: " + info.response))
            .catch(err => console.log("Error while sending mail", err))
        
        res.status(200).json({ message: `password reset link sent to ${email}`})
        
    } 
    catch (error) {
        return res.status(404).json({message: "something went wrong"})
    }
}
const resetPassword = async (req, res) => {
    try {
        let { newPassword, token } = req.body
        if (!newPassword || !token) return res.status(400).json({ message: "please provide token and new password" })
        const decoded = jwt.verify(token, process.env.RESET_SECRET)
        let checkUser = await User.findById(decoded.id)
        if (!checkUser) return res.status(404).json({ message: "user not found" })
        checkUser.password = await bcrypt.hash(newPassword, 10)
        await checkUser.save()
        res.status(200).json({ message: "password reset successful" })
    } catch (error) {
       return res.status(500).json({ message: error.message })
    }
}

export { createUser, getAllUsers, getOneUser, updateUser, updateProfile, deleteUser, login, forgotPassword, resetPassword }