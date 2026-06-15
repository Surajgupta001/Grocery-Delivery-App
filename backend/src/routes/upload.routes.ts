import express from "express";
import { auth } from "../../middlewares/auth.middlewares.js";
import { upload } from "../../config/multer.js";
import { uploadImage } from "../controllers/upload.controllers.js";

const uploadRouter = express.Router();

uploadRouter.post("/", auth, upload.single("image"), uploadImage);

export default uploadRouter;