const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cookieParser())
const corsOrigins = [ "http://localhost:5173" ]
if (process.env.FRONTEND_URL) {
    corsOrigins.push(process.env.FRONTEND_URL)
}

app.use(cors({
    origin: corsOrigins,
    credentials: true
}))

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)



module.exports = app