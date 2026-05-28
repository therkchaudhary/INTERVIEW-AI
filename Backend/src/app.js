const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.set("trust proxy", 1)

const allowedOrigins = [
    "http://localhost:5173",
    "https://interview-ai-app-pypn.onrender.com"
]

if (process.env.FRONTEND_URL) {
    const frontendUrl = process.env.FRONTEND_URL.trim().replace(/\/$/, "")
    if (frontendUrl && !allowedOrigins.includes(frontendUrl)) {
        allowedOrigins.push(frontendUrl)
    }
}

const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(null, false)
        }
    },
    credentials: true,
    methods: [ "GET", "POST", "PUT", "DELETE", "OPTIONS" ],
    allowedHeaders: [ "Content-Type", "Authorization" ]
}

app.use(cors(corsOptions))
app.options(/.*/, cors(corsOptions))

app.use(express.json())
app.use(cookieParser())

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)



module.exports = app