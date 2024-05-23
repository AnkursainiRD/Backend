import mongoose from "mongoose";
import { DB_Name } from "../constant.js";

const dbConnect=async()=>{
    try {
        await mongoose.connect(`${process.env.DATABASE_URI}=${DB_Name}`)
        console.log("MongoDB Connected");
    } catch (error) {
        console.log("Connection of DB failed",error);
        process.exit(1)
    }
}
export default dbConnect;