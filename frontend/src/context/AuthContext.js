import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // 1. Check Login Status on App Start
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);

                // Check if Token is Expired
                const currentTime = Date.now() / 1000;
                if (decoded.exp < currentTime) {
                    logout(); // Token expired, logout user
                } else {
                    // Valid Token, Set User
                    setUser({
                        id: decoded.sub,
                        role: decoded.role
                    });
                }
            } catch (e) {
                logout(); // Invalid token
            }
        }
        setLoading(false);
    }, []);

    // 2. Login Function
    const login = (token, userData) => {
        localStorage.setItem('token', token);

        // Decode role for immediate navigation
        const decoded = jwtDecode(token);
        setUser({ ...userData, role: decoded.role });

        // Redirect based on Role
        if (decoded.role === 'Admin') navigate('/admin-dashboard');
        else if (decoded.role === 'Teacher') navigate('/teacher-dashboard');
        else navigate('/student-dashboard');
    };

    // 3. Logout Function
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;