import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Register User
export const registerUser = async (username, email, password, role = 'user') => {
    try {
        const response = await apiClient.post('/auth/register', { username, email, password, role });
        return response.data; // Return response data for further use
    } catch (error) {
        console.error('Registration failed:', error.response || error.message || error);
        throw error; // Rethrow error for handling in the caller
    }
};

// Login User
export const loginUser = async (username, password) => {
    try {
        const response = await apiClient.post('/auth', { username, password });
        return response.data; // Return JWT and user info
    } catch (error) {
        console.error('Login failed:', error.response || error.message || error);
        throw error; // Rethrow error for handling in the caller
    }
};

// Create a Request (New Function)
export const createRequest = async (username, product_name, quantity) => {
    try {
        const response = await apiClient.post('/requests', { username, product_name, quantity });
        return response.data; // Return response data for further use
    } catch (error) {
        console.error('Request creation failed:', error.response || error.message || error);
        throw error; // Rethrow error for handling in the caller
    }
};
