import dotenv from 'dotenv'
import dbConnect from "./database/Database.js";
import app from './app.js';

dotenv.config({
    path:"./env"
})
dbConnect()
.then(()=>{
    app.listen(process.env.PORT || 4000, ()=>{
        console.log("Server Started at",process.env.PORT);
    })
})
.catch((error)=>{
    console.log("Mngodb connectino failed",error);
})