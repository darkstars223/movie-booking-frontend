import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({ fullname: '', email: '', password: '' });
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', formData);
            alert("Đăng ký thành công! Hãy đăng nhập.");
            navigate('/login');
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi đăng ký");
        }
    };

    return (
        <div style={containerStyle}>
            <h2>Đăng Ký Tài Khoản</h2>
            <form onSubmit={handleRegister}>
                <input type="text" placeholder="Họ tên" style={inputStyle} 
                    onChange={e => setFormData({...formData, fullname: e.target.value})} required />
                <input type="email" placeholder="Email" style={inputStyle} 
                    onChange={e => setFormData({...formData, email: e.target.value})} required />
                <input type="password" placeholder="Mật khẩu" style={inputStyle} 
                    onChange={e => setFormData({...formData, password: e.target.value})} required />
                <button type="submit" style={btnStyle}>Đăng Ký</button>
            </form>
            <p onClick={() => navigate('/login')} style={{ cursor: 'pointer', marginTop: '15px' }}>Đã có tài khoản? Đăng nhập</p>
        </div>
    );
};

const containerStyle = { color: 'white', maxWidth: '400px', margin: '80px auto', padding: '30px', background: '#181818', borderRadius: '10px', textAlign: 'center' };
const inputStyle = { width: '100%', padding: '12px', margin: '10px 0', borderRadius: '5px', border: '1px solid #333', background: '#222', color: 'white' };
const btnStyle = { width: '100%', padding: '12px', background: '#e50914', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' };

export default Register;