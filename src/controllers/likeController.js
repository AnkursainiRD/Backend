import {Like} from "../models/likeModel.js"
import apiError from "../utils/apiError.js"
import apiResponce from "../utils/apiResponce.js"
import { asyncHandler } from "../utils/asyncHandler.js"

//toggle video like
const toggleVideoLike=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    const userId=req.user?._id
    if(!videoId){
        throw new apiError(404,"Video not found!")
    }
    const likeVideo=await Like.findByIdAndUpdate({_id},{$set:{video:videoId,likedBy:userId}},{new:true})
    return res.status(200).json(
        new apiResponce(200,likeVideo,"Video Liked")
    )
})

//toggle comment like
const toggleCommentLike=asyncHandler(async(req,res)=>{
    const {commentId}=req.params
    const userId=req.user?._id
    if(!commentId){
        throw new apiError(404,"Comment not found!")  
    }
    const likeComment=await Like.findByIdAndUpdate({_id:user},{$set:{likedBy:userId,comment:commentId}})
    return res.status(200).json(
        new apiResponce(200,likeComment,"Comment Liked")
    )
})

//toggle community post like
const toggleCommunityPostLike=asyncHandler(async(req,res)=>{
    const {communityPostId}=req.params
    const userId=req.user?._id
    if(!communityPostId){
        throw new apiError(404,"Community Post not found!")  
    }
    const likeCommunityPost=await Like.findByIdAndUpdate({_id:user},{$set:{likedBy:userId,comment:commentId}})
    return res.status(200).json(
        new apiResponce(200,likeCommunityPost,"Community Post Like")
    )
})

//get liked videos
const getLikedVideos=asyncHandler(async(req,res)=>{
    const userId=req.user?._id
})

export {toggleCommentLike,toggleVideoLike,toggleCommunityPostLike}