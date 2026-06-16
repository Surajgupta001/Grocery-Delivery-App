import React, { createContext, useState, useEffect } from "react";
import type { User } from "../types";
import api from "../config/api";

export interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    updateUser: (userData: Partial<User>) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem("auth_user");
        try {
            return storedUser ? JSON.parse(storedUser) : null;
        } catch {
            return null;
        }
    });
    const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const response = await api({
            method: 'get',
            url: '/v1/auth/login',
            data: { email, password }
        });
        const userData = response.data.data.user;
        const tokenData = response.data.data.token;
        const formattedUser = {
            ...userData,
            _id: userData.id || userData._id
        };
        localStorage.setItem("auth_token", tokenData);
        localStorage.setItem("auth_user", JSON.stringify(formattedUser));
        setToken(tokenData);
        setUser(formattedUser);
    };

    const register = async (name: string, email: string, password: string) => {
        const response = await api.post("/v1/auth/register", { name, email, password });
        const userData = response.data.data.user;
        const tokenData = response.data.data.token;
        const formattedUser = {
            ...userData,
            _id: userData.id || userData._id
        };
        localStorage.setItem("auth_token", tokenData);
        localStorage.setItem("auth_user", JSON.stringify(formattedUser));
        setToken(tokenData);
        setUser(formattedUser);
    };

    const logout = () => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setToken(null);
        setUser(null);
    };

    const updateUser = (userData: Partial<User>) => {
        if (user) {
            const updated = { ...user, ...userData };
            localStorage.setItem("auth_user", JSON.stringify(updated));
            setUser(updated);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}