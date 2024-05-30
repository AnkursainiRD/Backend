import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import apiError from "./apiError.js";

          
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

export const cloudinaryUpload=async (localFilePath)=>{
  try {
    if(!localFilePath) return null
    const responce=await cloudinary.uploader.upload(localFilePath,{resource_type:"auto"})
    console.log("File Uploaded:",responce.url);
    fs.unlinkSync(localFilePath)
    return responce
  } catch (error) {
    fs.unlinkSync(localFilePath)  //remove local temp saved file if operation failed
    return null
  }
}

export const cloudinaryDelete=async (publicId)=>{
  try {
    console.log(publicId);
    const imageUrl = publicId.split('/').pop().split('.')[0];
    const responce=await cloudinary.uploader.destroy(imageUrl)
    if(!responce){
      throw new apiError(401,"Error while deleting data from cloudinary!")
    }
    console.log(responce)
  } catch (error) {
    console.log(error);
    return null
  }
}