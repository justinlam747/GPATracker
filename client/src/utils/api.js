import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || (
        process.env.NODE_ENV === 'production'
            ? 'https://gpaconnect.me/api'
            : 'http://localhost:5000/api'
    ),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
