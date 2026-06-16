import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL!,
})

// Inject JWT token from localStorage into every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle Auth error globally
api.interceptors.response.use(
    (Response) => Response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token and redirect to login
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");

            // Only redirect if not already on auth page
            if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/register")) {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
)

export default api;