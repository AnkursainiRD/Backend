import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/userModel.js";
import apiError from "../utils/apiError.js";
import { cloudinaryUpload } from "../utils/cloudinary.js";
import apiResponce from "../utils/apiResponce.js";

const registerUser=asyncHandler(async (req,res)=>{

    const {fullname,email,password,username}=req.body
    console.log(req.body);
    if([fullname,email,password,username].some((field)=>field?.trim()==="")){
        throw new apiError(400,"All fileds is required")
    }

    const existedUser=await User.findOne({$or:[{username}, {email}]})
    if(existedUser){
        throw new apiError(409,"User with email and username already exist")
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
    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    if(!createdUser){
        throw new apiError(500,"Something went wrong while registering the user")
    }
    return res.status(201).json(
        new apiResponce(200, createdUser, "User Registered Successfully")
    )
})

export {registerUser}