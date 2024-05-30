import {Video} from "../models/videoModel.js"
import { User } from "../models/userModel.js"
import { cloudinaryDelete, cloudinaryUpload } from "../utils/cloudinary.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import apiError from "../utils/apiError.js"
import apiResponce from "../utils/apiResponce.js"

//get all videos
const getAllVideos=asyncHandler(async(req,res)=>{
    const videos=await Video.find({})
    if(!videos){
        throw new apiError(404,"No data left!")
    }
    return res.status(200).json(
        new apiResponce(200,videos,"Videos fetched successfully")
    )
})

//get video by id
const getVideoById=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    if(!videoId){
        throw new apiError(401,"Video id missing!")
    }
    const video=await Video.findById({videoId})
    if(!video){
        throw new apiError(404,"No data found!")
    }
    return res.status(200).json(
        new apiResponce(200,video,"Video fetched")
    )
})

//publish videos
const publishVideos=asyncHandler(async(req,res)=>{
    const {title,description}=req.body
    const userId=req.user._id
    if(!title || !description){
        throw new apiError(404,"Title or description missing!")
    }
    const videoLocalPath=req.file?.video?.path
    const thumbnailLocalPath=req.file?.thumbnail?.path
    if(!videoLocalPath || !thumbnailLocalPath){
        throw new apiError(404,"Video or thumbnail is missing!")
    }
    const uploadedVideo=await cloudinaryUpload(videoLocalPath)
    const uploadedThumbnail=await cloudinaryUpload(thumbnailLocalPath)
    if(!uploadedThumbnail){
        throw new apiError(404,"Thumbnail uploading failed!")
    }
    if(!uploadedVideo){
        throw new apiError(400,"Failed video upload!")
    }
    const video=await Video.create({
        videoFile:uploadedVideo?.url,
        thumbnail:uploadedThumbnail?.url,
        title:title,
        description:description,
        duration:uploadedVideo?.duration,
        owner:userId
    })
    return res.status(200).json(
        new apiResponce(200,video,"Video Uploaded")
    )
})

//update video
const updateVideo=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    const {title,description}=req.body
    const newThumbnanil=req.file?.thumbnail?.path
    if(!title || !description || !newThumbnanil){
        throw new apiError(401,"Invalid Update!")
    }
    if(!videoId){
        throw new apiError(402,"Video not found!")
    }
    const uploadedThumbnail=await cloudinaryUpload(newThumbnanil)
    if(!uploadedThumbnail){
        throw new apiError(401,"Failed while updating thumbnail!")
    }
    const video=await Video.findById({_id:videoId})
    const oldThumbnail=video?.thumbnail
    await cloudinaryDelete(oldThumbnail)
    video.thumbnail=uploadedThumbnail?.url
    await video.save()
    return res.status(200).json(
        new apiResponce(200,video,"Udated Succesfuly")
    )
})
//delete video
const deleteVideo=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    if(!videoId){
        throw new apiError(402,"Video not found!")
    }
    const deletedVideo=await Video.aggregate([
        {
            $match:{_id:videoId}
        },
        {
            $project:{
                _id:1,
                thumbnail:1,
                videoFile:1
            }
        }
    ])
    await cloudinaryDelete(deletedVideo[0]?.thumbnail)
    await cloudinaryDelete(deletedVideo[0]?.videoFile)
    await Video.findByIdAndDelete({_id:videoId})
    return res.status(200).json(
        new apiResponce(200,"Video Deleted Successfuly")
    )
})

//toggle publish status


export {getAllVideos,getVideoById,publishVideos,updateVideo,deleteVideo}