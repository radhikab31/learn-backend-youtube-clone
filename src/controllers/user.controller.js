import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/users.model.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
const options = {
  httpOnly: true,
  secure: true,
};

const generateAccessandRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error while generating access and refresh token");
  }
};

const getPublicIdFromUrl = (url) => {
  const parts = url.split("/");
  const fileName = parts[parts.length - 1];
  return fileName.split(".")[0]; // strips extension
};

const updateFileImage = async (req, res, field) => {
  const fileLocalPath = req.file?.path;
  if (!fileLocalPath) {
    throw new ApiError(400, " file is required");
  }

  const file = await uploadOnCloudinary(fileLocalPath);
  if (!file?.url) {
    throw new ApiError(500, "Image url not available");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const oldFileUrl = user[field];

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { [field]: file.url } },
    { new: true }
  ).select("-password -refreshToken");

  if (oldFileUrl) {
    await deleteFromCloudinary(getPublicIdFromUrl(oldFileUrl));
  }

  return updatedUser;
};

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validation so that the required are not empty
  //check if user already exist
  //check for images, check for avatar
  //upload them to cloudinary
  //create user object - create entry in db
  //remove password and refreshtoken from the response
  //check for user creation
  //return res

  const { fullName, email, password, username } = req.body;

  if (
    [fullName, email, password, username].some(
      (data) => !data || data.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exist");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  // console.log("check the avatar", avatar, avatarLocalPath);
  if (!avatar) {
    throw new ApiError(400, "avatar file is requried");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering a user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Succesfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //take data from the user
  //verify the data not empty
  //find the user in db if valid
  //if valid then check password
  //generate accesstoken and refresh token
  //send token in cookies
  //return res
  //suppose you are getting logged in using
  const { email, username, password } = req.body;
  if (!email) {
    throw new ApiError(400, "Invalid email or username");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "wrong credentials entered");
  }

  const { accessToken, refreshToken } = await generateAccessandRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});
const logoutUser = asyncHandler(async (req, res) => {
  //request user
  //set the refresh token of the user undefined
  //clear the cookies
  //send response
  const userId = req.user._id;
  await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(201)
    .cookie("accessToken", options)
    .cookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});
const refreshAccessToken = asyncHandler(async (req, res) => {
  //access the incoming refresh token from the cookie
  //verify the token from jwt
  //find the user by id as verified token also holds the id
  //then verify whether the incoming token and the db token matched or not
  //generate new access and refresh tokens
  //send them as cookie again
  //send response
  console.log("check", req.cookies, req.body);
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized refresh token");
  }
  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET_KEY
  );
  const user = await User.findById(decodedToken._id);

  if (!user) {
    throw new ApiError(401, "Invalid Refresh Token");
  }

  if (incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, "Refresh token is used or expired");
  }

  const { accessToken, refreshToken } = await generateAccessandRefreshTokens(
    user._id
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken: refreshToken },
        "Refresh token generated"
      )
    );
});
const changePassword = asyncHandler(async (req, res) => {
  //fetch the old, new and confirm password from the req
  //check new and confirm password are same
  //fetch the user
  //check the old password match from the db
  //replace the new password
  //return the response
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (!(confirmPassword === newPassword)) {
    throw new ApiError(401, "new and confirm Password should match");
  }
  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(402, "Old password is invalid");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});
const getCurrentUser = asyncHandler(async (req, res) => {
  //get the from the req (basically here there is amidleware that is)
  res
    .status(200)
    .json(new ApiResponse(200, req.user, "user fetched successfully"));
});
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(401, "Credentials are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateAvatarFile = asyncHandler(async (req, res) => {
  const user = await updateFileImage(req, res, "avatar");
  return res.status(200).json(200, user, "Avatar file updated");
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const user = await updateFileImage(req, res, "coverImage");
  return res.status(200).json(200, user, "Cover Image file updated");
});

// changePassword, getCurrentUser, updateAccountDetails, updateAvatarFile, updateCoverImage

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatarFile,
  updateCoverImage,
};
