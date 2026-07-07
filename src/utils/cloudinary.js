import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

// console.log("check the cloudinary", process.env.CLOUDINARY_API_KEY);
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // console.log("check the localPath", localFilePath);
    //upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // console.log("File uploaded on cloudinary successfully", response);

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    // console.log("CLOUDINARY UPLOAD ERROR:", error);
    fs.unlinkSync(localFilePath); //remove the loclly saved temporary file as the upload operation got failed
    return null;
  }
};

export { uploadOnCloudinary };
