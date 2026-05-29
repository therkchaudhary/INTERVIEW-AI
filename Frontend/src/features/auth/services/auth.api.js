import axios from "axios"


const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "http://localhost:3000" : "https://interview-ai-xths.onrender.com"),
    withCredentials: true
})

export async function register({ username, email, password }) {
    const response = await api.post('/api/auth/register', {
        username, email, password
    })
    return response.data
}

export async function login({ email, password }) {
    const response = await api.post("/api/auth/login", {
        email, password
    })
    return response.data
}

export async function logout() {
    try {
        const response = await api.get("/api/auth/logout")
        return response.data
    } catch (err) {
        // Intentionally swallowed — logout should not throw
    }
}

export async function getMe() {
    const response = await api.get("/api/auth/get-me")
    return response.data
}