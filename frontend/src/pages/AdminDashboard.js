import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import AuthContext from '../context/AuthContext';

const AdminDashboard = () => {
    const { logout } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const s = await API.get('/admin/stats');
            setStats(s.data);
            const u = await API.get('/admin/users');
            setUsers(u.data);
        } catch (e) { alert("Unauthorized"); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this user permanently?")) {
            try {
                await API.delete(`/admin/users/${id}`);
                setUsers(users.filter(u => u._id !== id)); // UI update without reload
            } catch (e) { alert("Error deleting user"); }
        }
    };

    return (
        <div className="dashboard-container">
            <div className="profile-card" style={{ background: 'linear-gradient(135deg, #1f2937, #374151)' }}>
                <h1>🛡️ Admin Panel</h1>
                <button onClick={logout} className="danger-btn">Logout</button>
            </div>

            {/* Stats */}
            <div className="grid-layout">
                <div className="card text-center">
                    <h3>Total Users</h3>
                    <h1>{stats?.total_students + stats?.total_teachers || 0}</h1>
                </div>
                <div className="card text-center">
                    <h3>Total Quizzes</h3>
                    <h1>{stats?.total_quizzes || 0}</h1>
                </div>
            </div>

            {/* User Management Table */}
            <div className="card mt-4">
                <h2>👤 User Management</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                        <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>Name</th>
                            <th style={{ padding: '12px' }}>Email</th>
                            <th style={{ padding: '12px' }}>Role</th>
                            <th style={{ padding: '12px' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '12px' }}>{u.name}</td>
                                <td style={{ padding: '12px' }}>{u.email}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.85rem',
                                        background: u.role === 'Admin' ? '#fee2e2' : '#d1fae5',
                                        color: u.role === 'Admin' ? '#dc2626' : '#059669'
                                    }}>
                                        {u.role}
                                    </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    {u.role !== 'Admin' && (
                                        <button
                                            onClick={() => handleDelete(u._id)}
                                            className="danger-btn"
                                            style={{ padding: '5px 10px', fontSize: '0.9rem' }}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;