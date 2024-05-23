import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/userModel.js";
import apiError from "../utils/apiError.js";
import { cloudinaryUpload } from "../utils/cloudinary.js";
import apiResponce from "../utils/apiResponce.js";
import jwt from "jsonwebtoken"


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
   await User.findByIdAndUpdate(userId,{$set:{refreshToken:undefined}},{new:true})

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

export {registerUser,loginUser,logoutUser,refreshAccessToken,changePassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage}