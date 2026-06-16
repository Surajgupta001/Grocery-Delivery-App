import type { Request, Response } from 'express';
import { prisma } from '../../config/prisma.js';
import type { Prisma } from '@prisma/client';
import { extractParam } from '../utils/utils.js';

interface ProductQueryParams {
    category?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
    limit?: string;
}

// GET /api/v1/products/flash-deals
export const getFlashDeals = async (req: Request, res: Response) => {
    try {
        const products = await prisma.product.findMany({
            where: {
                stock: { gt: 0 },
            },
            orderBy: {
                originalPrice: 'desc',
            },
            take: 8,
        });

        const productsWithDiscount = products.map((product) => {
            const discount =
                product.originalPrice && product.price
                    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                    : 0;

            return { ...product, discount };
        });

        res.status(200).json({
            success: true,
            message: 'Flash deals retrieved successfully',
            data: { products: productsWithDiscount },
        });
    } catch (error) {
        console.error('Error fetching flash deals:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching flash deals',
        });
    }
};

// GET /api/v1/products
export const getProducts = async (req: Request, res: Response) => {
    try {
        const { category, search, minPrice, maxPrice, sort, page = '1', limit = '20' } =
            req.query as ProductQueryParams;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const where: Prisma.ProductWhereInput = {};

        if (category && category !== 'all') {
            where.category = category;
        }

        if (search && typeof search === 'string') {
            where.name = {
                contains: search,
                mode: 'insensitive',
            };
        }

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) {
                where.price.gte = parseFloat(minPrice);
            }
            if (maxPrice) {
                where.price.lte = parseFloat(maxPrice);
            }
        }

        const orderBy: Prisma.ProductOrderByWithRelationInput =
            sort === 'price-low'
                ? { price: 'asc' }
                : sort === 'price-high'
                  ? { price: 'desc' }
                  : { createdAt: 'desc' };

        const [products, totalCount] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy,
                skip,
                take: limitNum,
            }),
            prisma.product.count({ where }),
        ]);

        const productsWithDiscount = products.map((product) => {
            const discount =
                product.originalPrice && product.price
                    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                    : 0;

            return { ...product, discount };
        });

        const totalPages = Math.ceil(totalCount / limitNum);

        res.status(200).json({
            success: true,
            message: 'Products retrieved successfully',
            data: {
                products: productsWithDiscount,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalCount,
                    limit: limitNum,
                },
            },
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching products',
        });
    }
};

// GET /api/v1/products/:id
export const getProductById = async (req: Request, res: Response) => {
    try {
        const id = extractParam(req.params.id);

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required',
            });
        }

        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        const discount =
            product.originalPrice && product.price
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : 0;

        res.status(200).json({
            success: true,
            message: 'Product retrieved successfully',
            data: { product: { ...product, discount } },
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the product',
        });
    }
};

// POST /api/v1/products (Admin only)
export const createProduct = async (req: Request, res: Response) => {
    try {
        const { name, description, price, originalPrice, image, category, unit, stock, isOrganic } = req.body;

        if (!name || !price || !image || !category) {
            return res.status(400).json({
                success: false,
                message: 'Name, price, image, and category are required',
            });
        }

        if (typeof price !== 'number' || price < 0) {
            return res.status(400).json({
                success: false,
                message: 'Price must be a positive number',
            });
        }

        if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) {
            return res.status(400).json({
                success: false,
                message: 'Stock must be a non-negative number',
            });
        }

        const product = await prisma.product.create({
            data: {
                name: name.trim(),
                description: description?.trim() || '',
                price,
                originalPrice: originalPrice ?? 0,
                image,
                category: category.trim(),
                unit: unit?.trim() || 'piece',
                stock: stock ?? 0,
                isOrganic: isOrganic ?? false,
            },
        });

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: { product },
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while creating the product',
        });
    }
};

// PUT /api/v1/products/:id (Admin only)
export const updateProduct = async (req: Request, res: Response) => {
    try {
        const id = extractParam(req.params.id);

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required',
            });
        }

        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update provided',
            });
        }

        const existingProduct = await prisma.product.findUnique({ where: { id } });
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        const allowedFields = [
            'name', 'description', 'price', 'originalPrice',
            'image', 'category', 'unit', 'stock', 'isOrganic',
        ];

        const updateData: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update provided',
            });
        }

        const product = await prisma.product.update({
            where: { id },
            data: updateData,
        });

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: { product },
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the product',
        });
    }
};

// DELETE /api/v1/products/:id (Admin only - soft delete)
export const softDeleteProduct = async (req: Request, res: Response) => {
    try {
        const id = extractParam(req.params.id);

        const existingProduct = await prisma.product.findUnique({ where: { id } });
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        await prisma.product.update({
            where: { id },
            data: { stock: 0 },
        });

        res.status(200).json({
            success: true,
            message: 'Product deactivated successfully',
        });
    } catch (error) {
        console.error('Error deactivating product:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while deactivating the product',
        });
    }
};
