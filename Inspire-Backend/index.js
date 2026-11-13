import express from 'express'
import {config} from 'dotenv'
config()
import mongoose from 'mongoose'
import userRoutes from './Routes/userRoutes.js'
import postRoutes from './Routes/postRoutes.js'
import commentRoutes from './Routes/commentRoutes.js'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import cors from 'cors'
let app = express()
let port = process.env.PORT || 9090

app.use(helmet())
app.use('/uploads', helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }))
const allowedOrigins = (
    process.env.FRONTEND_URL || 'https://inkspireblog.vercel.app'
).split(',').map(origin => origin.trim()).filter(Boolean)
if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:5173')
}
app.use(cors({
    origin: allowedOrigins,
    credentials:true
}))
app.use(express.static('src'))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({extended:true}));
app.use(cookieParser())

mongoose.connect(process.env.MONGODB_URI)
.then(()=>(console.log('MongoDB connected successfully')))
.catch((err)=>console.log(`Error while connecting : ${err}`))

const limit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5, // limit each IP to 5 requests per windowMs
    // max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, try again later.'
});
  
app.use(limit)
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/comments', commentRoutes)
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
})
