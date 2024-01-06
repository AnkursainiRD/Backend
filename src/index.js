import dotenv from 'dotenv'
import express from "express";
const app=express();
import dbConnect from "./database/Database.js";

dotenv.config({
    path:"./env"
})
dbConnect()

app.get('/',function(req,res){
    res.send("Working properly")
})

app.listen(3000)