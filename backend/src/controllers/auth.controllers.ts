import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { generateToken, isUserAdmin } from '../utils/utils.js';

// Register
// POST /api/v1/auth/register
export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required',
            });
        }

        if (typeof name !== 'string' || name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Name must be at least 2 characters',
            });
        }

        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters',
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof email !== 'string' || !emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User already exists with this email',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: normalizedEmail,
                password: hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        const isAdmin = isUserAdmin(user.email);
        const token = generateToken(user.id, isAdmin ? 'admin' : 'user');

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                user: { ...user, isAdmin },
                token,
            },
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during registration',
        });
    }
};

// Login
// POST /api/v1/auth/login
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            include: {
                addresses: true,
            },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        const isAdmin = isUserAdmin(user.email);
        const token = generateToken(user.id, isAdmin ? 'admin' : 'user');

        const { password: _, ...safeUserData } = user;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: { ...safeUserData, isAdmin },
                token,
            },
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during login',
        });
    }
};
