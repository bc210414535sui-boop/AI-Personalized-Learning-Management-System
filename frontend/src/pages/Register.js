import React, { useState } from 'react';
import API from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Student' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await API.post('/auth/register', formData);
            alert('Registration Successful! Please Login.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration Failed. Email might be taken.');
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <h2 style={{ color: 'var(--primary-color)' }}>Create Account</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Join the AI Learning Platform today.</p>

            {error && <div style={{ color: 'red', background: '#fee2e2', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Full Name"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
                <input
                    type="email"
                    placeholder="Email Address"
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                />

                <select onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                    <option value="Student">Student</option>
                    <option value="Teacher">Teacher</option>
                </select>

                <button type="submit" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
            </form>

            <p className="mt-4">
                Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>Login here</Link>
            </p>
        </div>
    );
};

export default Register;