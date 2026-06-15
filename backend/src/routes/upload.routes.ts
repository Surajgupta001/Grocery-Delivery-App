import express from "express";
import { auth } from "../../middlewares/auth.middlewares";
import { upload } from "../../config/multer";
import { uploadImage } from "../controllers/upload.controllers";

const uploadRouter = express.Router();

uploadRouter.post("/", auth, upload.single("image"), uploadImage);

export default uploadRouter;