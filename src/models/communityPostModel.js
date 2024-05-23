import mongoose from "mongoose";

const communityPostSchema=new mongoose.Schema({
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    content:{
        type:String,
        required:true
    }
},{timestamps:true})

export const CommunityPost=mongoose.model("CommunityPost",communityPostSchema)