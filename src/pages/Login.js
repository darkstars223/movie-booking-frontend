import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            alert("Đăng nhập thành công!");
            navigate('/');
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi đăng nhập");
        }
    };

    return (
        <div style={{ color: 'white', maxWidth: '400px', margin: '100px auto', padding: '20px', background: '#222', borderRadius: '8px' }}>
            <h2>Đăng Nhập</h2>
            <form onSubmit={handleLogin}>
                <input type="email" placeholder="Email" style={inputStyle} onChange={e => setEmail(e.target.value)} required />
                <input type="password" placeholder="Mật khẩu" style={inputStyle} onChange={e => setPassword(e.target.value)} required />
                <button type="submit" style={btnStyle}>Đăng Nhập</button>
            </form>
            <p onClick={() => navigate('/register')} style={{ cursor: 'pointer', marginTop: '10px', fontSize: '14px' }}>Chưa có tài khoản? Đăng ký ngay</p>
        </div>
    );
};

const inputStyle = { width: '100%', padding: '10px', margin: '10px 0', borderRadius: '4px', border: 'none' };
const btnStyle = { width: '100%', padding: '10px', background: '#e50914', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };

export default Login;