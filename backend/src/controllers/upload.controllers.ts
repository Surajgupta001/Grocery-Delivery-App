import type { Request, Response } from "express";
import cloudinary from "../../config/cloudinary.js";

export const uploadImage = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
        }

        const base64 = Buffer.from(req.file.buffer).toString("base64");

        const dataURI = `data:${req.file.mimetype};base64,${base64}`;

        const sanitizedFilename = req.file.originalname
            .split('.')
            .slice(0, -1)
            .join('.')
            .replace(/[^a-zA-Z0-9]/g, "_");

        const result = await cloudinary.uploader.upload(
            dataURI,
            {
                folder: "grocery-delivery-app/products",
                public_id: `${Date.now()}-${sanitizedFilename}`,
                resource_type: "auto",
            }
        );

        return res.status(200).json({
            success: true,
            message: "File uploaded successfully",
            data: {
                url: result.secure_url,
                public_id: result.public_id,
            },
        });
    } catch (error: any) {
        console.error("Error uploading file:", error);

        return res.status(500).json({
            success: false,
            message: error?.message || (typeof error === "string" ? error : JSON.stringify(error)) || "Error uploading file",
        });
    }
};