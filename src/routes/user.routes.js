import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatarFile,
  updateCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
); //working

router.route("/login").post(loginUser); //working
router.route("/logout").post(verifyJWT, logoutUser); //working
router.route("/refreh-token").post(refreshAccessToken); //working
router.route("/change-password").post(verifyJWT, changePassword); //working
router.route("/get-user").get(verifyJWT, getCurrentUser); //working
router.route("/update-account-details").post(verifyJWT, updateAccountDetails); //working
router
  .route("/update-avatar")
  .post(upload.single("avatar"), verifyJWT, updateAvatarFile); //working
router
  .route("/update-cover-image")
  .post(upload.single("coverImage"), verifyJWT, updateCoverImage); //working
export default router;
