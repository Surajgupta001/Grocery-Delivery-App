import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import bcrypt from 'bcryptjs';
import { generateToken, getAdminStatus } from '../utils/utils';

// Register
// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
        return res
            .status(400)
            .json({
                success: false,
                message: 'Name, email and password are required',
            });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: {
            email: email.toLowerCase(),
        }
    })

    // If user already exists, return error
    if (existingUser) {
        return res
            .status(400)
            .json({
                success: false,
                message: 'User already exists',
            });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            name,
            email: email.toLowerCase(),
            password: hashPassword,
        }
    })

    const token = generateToken(user.id);

    const userDate: any = { ...user };
    delete userDate.password;

    userDate.isAdmin = getAdminStatus(userDate.email);

    res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
            user: userDate,
            token,
        }
    });
};

// Login
// GET /api/auth/login
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res
            .status(400)
            .json({
                success: false,
                message: 'Email and password are required',
            });
    }

    const user = await prisma.user.findUnique({
        where: {
            email: email.toLowerCase(),
        },
        include: {
            addresses: true,
        }
    })

    if (!user) {
        return res
            .status(400)
            .json({
                success: false,
                message: 'Invalid email or password',
            });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
        return res
            .status(400)
            .json({
                success: false,
                message: 'Invalid email or password',
            });
    }

    // Generate token
    const token = generateToken(user.id);

    // Remove password from user data
    const userData: any = { ...user };
    delete userData.password;

    // Determine admin status
    userData.isAdmin = getAdminStatus(userData.email);

    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
            user: userData,
            token,
        }
    });
};