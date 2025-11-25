import axios from 'axios';

// Backend URL Configuration
const API = axios.create({
    baseURL: 'http://localhost:5000/api', // Flask Server URL
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request Interceptor: Har request ke saath Token bhejo
API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export default API;