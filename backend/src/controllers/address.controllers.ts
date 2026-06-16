import type { Request, Response } from 'express';
import { prisma } from '../../config/prisma.js';
import { extractParam } from '../utils/utils.js';

// Get user addresses
// GET /api/v1/addresses
export const getAddresses = async (req: Request, res: Response) => {
    try {
        const addresses = await prisma.address.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({
            success: true,
            message: 'Addresses retrieved successfully',
            data: addresses,
        });
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching addresses',
        });
    }
};

// Add Address
// POST /api/v1/addresses
export const addAddress = async (req: Request, res: Response) => {
    try {
        const { label, address, city, state, zip, isDefault, lat, lng } = req.body;

        if (!label || !address || !city || !state || !zip) {
            return res.status(400).json({
                success: false,
                message: 'Label, address, city, state, and zip are required',
            });
        }

        if (lat == null || lng == null) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required. Please enable location services.',
            });
        }

        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);

        if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
            return res.status(400).json({
                success: false,
                message: 'Invalid latitude or longitude values',
            });
        }

        const addressCount = await prisma.address.count({
            where: { userId: req.user!.id },
        });

        if (addressCount >= 10) {
            return res.status(400).json({
                success: false,
                message: 'Maximum of 10 addresses allowed',
            });
        }

        const makeDefault = addressCount === 0 ? true : !!isDefault;

        if (makeDefault) {
            await prisma.address.updateMany({
                where: { userId: req.user!.id },
                data: { isDefault: false },
            });
        }

        const newAddress = await prisma.address.create({
            data: {
                userId: req.user!.id,
                label: label.trim(),
                address: address.trim(),
                city: city.trim(),
                state: state.trim(),
                zip: zip.trim(),
                isDefault: makeDefault,
                lat: latNum,
                lng: lngNum,
            },
        });

        const addresses = await prisma.address.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'desc' },
        });

        res.status(201).json({
            success: true,
            message: 'Address added successfully',
            data: addresses,
        });
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while adding the address',
        });
    }
};

// Update Address
// PUT /api/v1/addresses/:id
export const updateAddress = async (req: Request, res: Response) => {
    try {
        const id = extractParam(req.params.id);
        const { label, address, city, state, zip, isDefault, lat, lng } = req.body;

        const existingAddress = await prisma.address.findFirst({
            where: {
                id,
                userId: req.user!.id,
            },
        });

        if (!existingAddress) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId: req.user!.id },
                data: { isDefault: false },
            });
        }

        const updateData: Record<string, unknown> = {};

        if (label !== undefined) updateData.label = String(label).trim();
        if (address !== undefined) updateData.address = String(address).trim();
        if (city !== undefined) updateData.city = String(city).trim();
        if (state !== undefined) updateData.state = String(state).trim();
        if (zip !== undefined) updateData.zip = String(zip).trim();
        if (isDefault !== undefined) updateData.isDefault = Boolean(isDefault);
        if (lat != null) {
            const latNum = parseFloat(lat);
            if (isNaN(latNum) || latNum < -90 || latNum > 90) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid latitude value',
                });
            }
            updateData.lat = latNum;
        }
        if (lng != null) {
            const lngNum = parseFloat(lng);
            if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid longitude value',
                });
            }
            updateData.lng = lngNum;
        }

        await prisma.address.update({
            where: { id },
            data: updateData,
        });

        const addresses = await prisma.address.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({
            success: true,
            message: 'Address updated successfully',
            data: addresses,
        });
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the address',
        });
    }
};

// Delete Address
// DELETE /api/v1/addresses/:id
export const deleteAddress = async (req: Request, res: Response) => {
    try {
        const id = extractParam(req.params.id);

        const existingAddress = await prisma.address.findFirst({
            where: {
                id,
                userId: req.user!.id,
            },
        });

        if (!existingAddress) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        await prisma.address.delete({
            where: { id },
        });

        if (existingAddress.isDefault) {
            const nextAddress = await prisma.address.findFirst({
                where: { userId: req.user!.id },
                orderBy: { createdAt: 'desc' },
            });

            if (nextAddress) {
                await prisma.address.update({
                    where: { id: nextAddress.id },
                    data: { isDefault: true },
                });
            }
        }

        const addresses = await prisma.address.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({
            success: true,
            message: 'Address deleted successfully',
            data: addresses,
        });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while deleting the address',
        });
    }
};
