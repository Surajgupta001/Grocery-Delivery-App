import React, { createContext, useEffect, useState } from "react";
import type { User } from "../types";
import { useNavigate } from "react-router-dom";
import api from "../config/api";
import toast from "react-hot-toast";

export interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    updateUser: (userData: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {

    const navigate = useNavigate();

    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem("auth_token");
        const savedUser = localStorage.getItem("auth_user");

        if (savedToken && savedUser && savedUser !== "undefined") {
            try {
                setUser(JSON.parse(savedUser));
                setToken(savedToken);
            } catch (error) {
                console.error("Failed to parse savedUser from localStorage", error);
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        // Implement login logic here, e.g., call API
        try {
            const { data } = await api.post('/auth/login', {
                email,
                password,
            })
            const { user, token } = data.data;
            setUser(user);
            setToken(token);
            localStorage.setItem("auth_token", token);
            localStorage.setItem("auth_user", JSON.stringify(user));
            toast.success("Login successful");
            navigate("/");
        } catch (error: any) {
            console.log("Login failed", error);
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const register = async (name: string, email: string, password: string) => {
        // Implement register logic here, e.g., call API
        try {
            const { data } = await api.post('/auth/register', {
                name,
                email,
                password,
            })
            const { user, token } = data.data;
            setUser(user);
            setToken(token);
            localStorage.setItem("auth_token", token);
            localStorage.setItem("auth_user", JSON.stringify(user));
            toast.success("Registration successful");
            navigate("/");
        } catch (error: any) {
            console.log("Registration failed", error);
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        toast.success("Logged out successfully");
        navigate("/login");
    }

    const updateUser = (userData: Partial<User>) => {
        if (user) {
            const updated = { ...user, ...userData };
            setUser(updated);
            localStorage.setItem("auth_user", JSON.stringify(updated));
            toast.success("User updated successfully");
        }
    }

    return <AuthContext.Provider value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser
    }}>
        {children}
    </AuthContext.Provider>
};

export default AuthContext;