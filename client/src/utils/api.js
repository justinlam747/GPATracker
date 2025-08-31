import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || (
        process.env.NODE_ENV === 'production'
            ? 'https://gpaconnect.me/api'  // Point to your new backend
            : 'http://localhost:5000/api'
    ),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => {
        console.log('API Response Success:', {
            status: response.status,
            url: response.config.url,
            data: response.data,
            dataType: typeof response.data,
            dataKeys: Object.keys(response.data || {}),
            hasUser: !!(response.data && response.data.user)
        });
        return response;
    },
    (error) => {
        console.log('API Response Error:', {
            status: error.response?.status,
            message: error.message,
            url: error.config?.url,
            data: error.response?.data
        });

        // Don't automatically redirect on 401 - let AuthContext handle token refresh
        // if (error.response?.status === 401) {
        //     localStorage.removeItem('token');
        //     window.location.href = '/login';
        // }
        return Promise.reject(error);
    }
);

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        console.log('API Request Interceptor:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            fullURL: `${config.baseURL}${config.url}`,
            hasToken: !!localStorage.getItem('token'),
            tokenPreview: localStorage.getItem('token') ? `${localStorage.getItem('token').substring(0, 20)}...` : 'none'
        });

        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Token added to request headers');
        } else {
            console.log('No token found for request');
        }
        return config;
    },
    (error) => {
        console.log('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

export default api;