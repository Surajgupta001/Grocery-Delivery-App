import type { Request, Response } from 'express';
import cloudinary from '../../config/cloudinary.js';

const ALLOWED_RESOURCE_TYPES = ['image'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export const uploadImage = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded',
            });
        }

        if (req.file.size > MAX_IMAGE_SIZE) {
            return res.status(400).json({
                success: false,
                message: 'File size must be less than 5MB',
            });
        }

        if (!ALLOWED_RESOURCE_TYPES.some((type) => req.file!.mimetype.startsWith(type))) {
            return res.status(400).json({
                success: false,
                message: 'Only image files are allowed',
            });
        }

        const base64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${base64}`;

        const sanitizedFilename = req.file.originalname
            .split('.')
            .slice(0, -1)
            .join('.')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .substring(0, 100);

        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'grocery-delivery-app/products',
            public_id: `${Date.now()}-${sanitizedFilename}`,
            resource_type: 'image',
            transformation: [
                { width: 800, height: 800, crop: 'limit' },
                { quality: 'auto' },
            ],
        });

        return res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                url: result.secure_url,
                public_id: result.public_id,
                width: result.width,
                height: result.height,
            },
        });
    } catch (error: unknown) {
        console.error('Error uploading file:', error);

        const errorMessage =
            error instanceof Error ? error.message : 'An error occurred while uploading the file';

        return res.status(500).json({
            success: false,
            message: errorMessage,
        });
    }
};
