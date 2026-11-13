import express from 'express'
import {config} from 'dotenv'
config()
import mongoose from 'mongoose'
import userRoutes from './Routes/userRoutes.js'
import postRoutes from './Routes/postRoutes.js'
import commentRoutes from './Routes/commentRoutes.js'
import gmailOAuthRoutes from './Routes/gmailOAuthRoutes.js'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import cors from 'cors'
let app = express()
let port = process.env.PORT || 9090
app.set('trust proxy', 1)

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

const createRateLimiter = (maxRequests, message) => rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message,
    handler: (_req, res, _next, options) => {
        res.status(options.statusCode).json({ message: options.message })
    }
})
const apiLimit = createRateLimiter(100, 'Too many API requests. Try again shortly.')
const loginLimit = createRateLimiter(5, 'Too many login attempts. Try again in 15 minutes.')
const signupLimit = createRateLimiter(5, 'Too many signup attempts. Try again in 15 minutes.')
const passwordResetLimit = createRateLimiter(5, 'Too many password reset attempts. Try again in 15 minutes.')
const gmailOAuthLimit = createRateLimiter(10, 'Too many Gmail authorization requests. Try again shortly.')

app.post('/api/users/login', loginLimit)
app.post('/api/users/signup', signupLimit)
app.post('/api/users/forgot-password', passwordResetLimit)
app.post('/api/users/reset-password', passwordResetLimit)
app.use('/api', apiLimit)
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/admin/gmail', gmailOAuthLimit, gmailOAuthRoutes)
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
})
