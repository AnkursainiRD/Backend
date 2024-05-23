import { Router } from "express";
import { changePassword, getCurrentChannel, getCurrentUser, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/userController.js";
import {upload} from "../middlewares/multerMiddleware.js"
import { verifyJWT } from "../middlewares/authMiddleware.js";
const router=Router()

//Auth Routes
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),registerUser)
router.route("/login").post(loginUser)

//Secured Routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changePassword)
router.route("/getCurrentUser").get(verifyJWT,getCurrentUser)
router.route("/updateDetails").patch(verifyJWT,updateAccountDetails)

router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/update-coverImage").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)

router.route("/channel/:username").get(verifyJWT,getCurrentChannel)
router.route("/watch-history").get(verifyJWT,getWatchHistory)

export default router;