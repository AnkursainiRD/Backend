import express from "express";
import cors from 'cors'
import cookieParser from 'cookie-parser'
const app=express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json({limit:'20kb'}))
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))
app.use(cookieParser())

//User Routes Import
import userRouter from "./routes/userRoutes.js";

//Routes mounted
app.use("/api/v1/users",userRouter)

export default app