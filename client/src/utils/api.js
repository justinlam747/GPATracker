import axios from 'axios';
import { supabase } from '../lib/supabase';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || (
        process.env.NODE_ENV === 'production'
            ? 'https://gpaconnect.me/api'
            : 'http://localhost:8787/api'
    ),
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);

// Request interceptor - get token from Supabase session
api.interceptors.request.use(
    async (config) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                config.headers.Authorization = `Bearer ${session.access_token}`;
            }
        } catch (error) {
            // Silently fail - request will proceed without auth
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
