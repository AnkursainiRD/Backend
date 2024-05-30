import mongoose from "mongoose";

const likeSchema=new mongoose.Schema({
    comment:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Comment"
    },
    likedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    video:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    },
    communityPost:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"CommunityPost"
    }
},{timestamps:true})

export const Like=mongoose.model("Like",likeSchema)