import { Router } from "express";
import { registerUser } from "../controllers/userController.js";
import {upload} from "../middlewares/multerMiddleware.js"
const router=Router()
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
router.route('/ch').post(function(req,res){
    const data=req.body;
    console.log(data);
})


export default router;