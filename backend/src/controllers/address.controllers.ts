import type { Request, Response } from "express";
import { prisma } from "../../config/prisma";

// Get user addresses
// GET /api/addresses
export const getAddresses = async (req: Request, res: Response) => {
    try {
        const addresses = await prisma.address.findMany({
            where: {
                userId: req.user!.id,
            },
            orderBy: {
                createdAt: 'desc',
            }
        })

        res
            .status(200)
            .json({
                success: true,
                message: 'Addresses retrieved successfully',
                data: addresses,
            })
    } catch (error) {
        res
            .status(500)
            .json({
                success: false,
                message: 'Error retrieving addresses',
            })
    }
};

// Add Addresses
// POST /api/addresses
export const addAddress = async (req: Request, res: Response) => {
    try {
        const { label, address, city, state, zip, isDefault, lat, lng } = req.body;

        // Required Coordinates
        if (lat == null || lng == null) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: 'Latitude and Longitude are required! Please enable location services and try again.',
                })
        }

        const currentAddresses = await prisma.address.findMany({
            where: {
                userId: req.user!.id,
            }
        })

        let makeDefault = isDefault;
        if (currentAddresses.length === 0) {
            makeDefault = true;
        }

        if (makeDefault) {
            await prisma.address.updateMany({
                where: {
                    userId: req.user!.id,
                },
                data: {
                    isDefault: false,
                }
            })
        }

        await prisma.address.create({
            data: {
                userId: req.user!.id,
                label,
                address,
                city,
                state,
                zip,
                isDefault: makeDefault,
                lat: Number(lat),
                lng: Number(lng),
            }
        });

        const addresses = await prisma.address.findMany({
            where: {
                userId: req.user!.id,
            },
            orderBy: {
                createdAt: 'desc',
            }
        })

        res
            .status(201)
            .json({
                success: true,
                message: 'Address added successfully',
                data: addresses,
            })

    } catch (error) {
        res
            .status(500)
            .json({
                success: false,
                message: 'Error adding address',
            })
    }
};

// Update Address
// PUT /api/addresses/:id
export const updateAddress = async (req: Request, res: Response) => {
    const { label, address, city, state, zip, isDefault, lat, lng } = req.body;

    // Required Coordinates
    if (lat == null || lng == null) {
        return res
            .status(400)
            .json({
                success: false,
                message: 'Latitude and Longitude are required! Please enable location services and try again.',
            })
    }

    if (isDefault) {
        await prisma.address.updateMany({
            where: {
                userId: req.user!.id,
            },
            data: {
                isDefault: false,
            }
        })
    }

    const data: any = {};

    if (label) data.label = label;
    if (address) data.address = address;
    if (city) data.city = city;
    if (state) data.state = state;
    if (zip) data.zip = zip;
    if (isDefault != undefined) data.isDefault = isDefault;
    if (lat != null) data.lat = Number(lat);
    if (lng != null) data.lng = Number(lng);

    try {
        await prisma.address.update({
            where: {
                id: req.params.id as string,
            },
            data,
        });

        const addresses = await prisma.address.findMany({
            where: {
                userId: req.user!.id,
            },
            orderBy: {
                createdAt: 'desc',
            }
        })

        res
            .status(200)
            .json({
                success: true,
                message: 'Address updated successfully',
                data: addresses,
            })
    } catch (error) {
        res
            .status(500)
            .json({
                success: false,
                message: 'Address not found or error updating address',
            })
    }
};

// Delete Address
// DELETE /api/addresses/:id
export const deleteAddress = async (req: Request, res: Response) => {
    try {
        await prisma.address.delete({
            where: {
                id: req.params.id as string,
            }
        });

        const addresses = await prisma.address.findMany({
            where: {
                userId: req.user!.id,
            },
            orderBy: {
                createdAt: 'desc',
            }
        })

        res
            .status(200)
            .json({
                success: true,
                message: 'Address deleted successfully',
                data: addresses,
            })
    } catch (error) {
        res
            .status(500)
            .json({
                success: false,
                message: 'Address not found or error deleting address',
            })
    }
};