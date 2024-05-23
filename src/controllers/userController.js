import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/userModel.js";
import apiError from "../utils/apiError.js";
import { cloudinaryUpload } from "../utils/cloudinary.js";
import apiResponce from "../utils/apiResponce.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


const generateAccessAndRefreshTokens=async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken= user.generateRefreshToken()
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}
    } catch (error) {
        throw new apiError(500,"Error while generating tokens")
    }
}

const registerUser=asyncHandler(async (req,res)=>{

    const {fullname,email,password,username}=req.body
    console.log(req.body);
    if([fullname,email,password,username].some((field)=>field?.trim()==="")){
        throw res.json(new apiError(400,"All fileds is required"))
    }

    const existedUser=await User.findOne({$or:[{username}, {email}]})
    if(existedUser){
        throw res.json(new apiError(409,"User with email and username already exist"))
    }
    const avatarLocalPath=req.files?.avatar[0]?.path

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


    if(!avatarLocalPath){
        throw new apiError(400,"Avatar image is required")
    }
    const avatar= await cloudinaryUpload(avatarLocalPath)
    const coverImage= await cloudinaryUpload(coverImageLocalPath)
    if(!avatar){
        throw new apiError(400,"Avatar image is required")
    }
    
    const user=await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })
    const createdUser= await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new apiError(500,"Error while registering the user")
    }
    return res.status(201).json(
        new apiResponce(200, createdUser, "User Registered Successfully")
    )
})

const loginUser=asyncHandler(async (req,res)=>{
    const {email,username,password}=req.body
    if([email,username,password].some((field)=>field?.trim()==="")){
        throw new apiError(400,"All fields are required!")
    }
    const existedUser=await User.findOne({$or:[{email:email},{username:username}]})
    if(!existedUser){
        throw new apiError(404,"User doesn't exists!")
    }

    if(!await existedUser.passwordCorrect(password)){
        throw new apiError(401,"Invalid user credentials!")
    }

    const {refreshToken,accessToken}= await generateAccessAndRefreshTokens(existedUser._id)
    const user=await User.findById(existedUser._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
        new apiResponce(200,{user,accessToken,refreshToken},"Login Successfuly")
    )
})

const logoutUser=asyncHandler(async (req,res)=>{
   const userId=req.user._id
   await User.findByIdAndUpdate(userId,{$unset:{refreshToken:1}},{new:true})

   const options={
    httpOnly:true,
    secure:true
}
   return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(
    new apiResponce(200,{},"Logout Successfuly")
   )
})

const refreshAccessToken=asyncHandler(async (req,res)=>{
    const incomingRefreshToken=req.cookies?.refreshToken || req.body?.refreshToken
    if(!incomingRefreshToken){
        throw new apiError(401,"Unauthorized Request!")
    }
   try {
        const decodedRefreshToken=jwt.verify(token,process.env.REFRESH_TOKEN_SECRET)
        const user=await User.findById(decodedRefreshToken?._id)
        if(!user){
            throw new apiError(401,"Invalid Refresh Token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new apiError(401,"Refresh Token is expired or used!")
        }
        const options={
            httpOnly:true,
            secure:true
        }
        const {accessToken,refreshToken:newRefreshToken}= await generateAccessAndRefreshTokens(user._id)
        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newRefreshToken,options).json(
            new apiResponce(200,{accessToken,refreshToken:newRefreshToken},"Access Token Refreshed")
        )
   } catch (error) {
        throw new apiError(401,"Error while refreshing token!")
   }
})

const changePassword=asyncHandler(async (req,res)=>{
    const {oldPassword,newPassword}=req.body
    if(!oldPassword || !newPassword){
        throw new apiError(401,"Password is rquired!")
    }
    const user=await User.findById(req.user?._id)
    if(!user){
        throw new apiError(404,"User doesn't exists!")
    }
    if(!user.passwordCorrect(oldPassword)){
        throw new apiError(401,"Invalid Password")
    }
    user.password=newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200).json( new apiResponce(200,{},"Password Changed Successfuly"))
})

const getCurrentUser=asyncHandler(async (req,res)=>{
    return res.status(200).json(
        new apiResponce(200,req.user,"User Fetched")
    )
})

const updateAccountDetails=asyncHandler(async (req,res)=>{
    const {fullname,email}=req.body
    if(!fullname || !email){
        throw new apiError(401,"All fields are required!")
    }
    const user=await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                fullname,
                email
                }
        },{new:true}
    ).select("-password")

    return res.status(200).json(
        new apiResponce(200,user,"Details updated successfuly")
    )
})

const updateUserAvatar=asyncHandler(async (req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new apiError(404,"Avatar is missing!")
    }
    const avatar=await cloudinaryUpload(avatarLocalPath)
    if(!avatar.url){
        throw new apiError(400,"Errow while updting avatar!")
    }
    const user=await User.findByIdAndUpdate(req.user?._id,{$set:{avatar:avatar.ur}},{new:true})
    return res.status(200).json(
        new apiResponce(200,user,"Avatar updated successfuly")
    )
})  

const updateUserCoverImage=asyncHandler(async (req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        throw new apiError(404,"Cover Image is missing!")
    }
    const coverImage=await cloudinaryUpload(coverImageLocalPath)
    if(!coverImage.url){
        throw new apiError(400,"Errow while updting cover image!")
    }
    const user=await User.findByIdAndUpdate(req.user?._id,{$set:{coverImage:coverImage.ur}},{new:true})
    return res.status(200).json(
        new apiResponce(200,user,"Cover Image updated successfuly")
    )
}) 

const getCurrentChannel=asyncHandler(async (req,res)=>{
    const {username}=req.params
    if(!username?.trim()){
        throw new apiError(401,"Username is missing!")
    }
    const channel=await User.aggregate([
        {
          $match:{username:username?.toLowerCase()}
        },
        {
            $lookup:{
                from:"subscriptions",
                localField: "_id",
                foreignField: "channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField: "_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
                channelSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                email:1,
                subscriberCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                username:1
            }
        }
    ])
    console.log(channel);
    if(!channel?.length()){
        throw new apiError(404,"Data not found!")
    }
    return res.status(200).json(
        new apiResponce(200,channel[0],"Channel fetched successfuly")
    )
})

const getWatchHistory=asyncHandler(async (req,res)=>{
    const user=await User.aggregate([
        {
            $match:{_id:new mongoose.Types.ObjectId(req.user._id)}
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"Owner",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        avatar:1,
                                        fullname:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{$first:"$owner"}
                        }
                    }
                ]
            }
        },

    ])

    return res.status(200).json(
        new apiResponce(200,user[0].watchHistory,"History Fetched")
    )
})

export {registerUser,loginUser,logoutUser,refreshAccessToken,changePassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage,getCurrentChannel,getWatchHistory}