import React, { useState, useContext } from 'react';
import API from '../services/api';
import AuthContext from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Login = () => {
    const { login } = useContext(AuthContext);
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await API.post('/auth/login', formData);
            // Login function context se call karein
            login(res.data.token, res.data.user);
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid Email or Password');
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <h2 style={{ color: 'var(--primary-color)' }}>AI Learning Login</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Welcome back! Please login to continue.</p>

            {error && <div style={{ color: 'red', background: '#fee2e2', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                />
                <input
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>

            <p className="mt-4">
                Don't have an account? <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>Register here</Link>
            </p>
        </div>
    );
};

export default Login;