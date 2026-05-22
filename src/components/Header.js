import React from 'react';
import { Film, User, Search, LayoutDashboard, LogOut, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  // Lấy thông tin user từ localStorage
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert("Đã đăng xuất");
    navigate('/login');
  };

  return (
    <nav style={navStyle}>
      <Link to="/" style={logoStyle}>
        <Film size={32} /> TTV CINEMA
      </Link>

      <div style={menuStyle}>
        <Link to="/" style={navItemStyle}>Trang chủ</Link>
        <Link to="/movies" style={navItemStyle}>Phim</Link>
        {user && <Link to="/my-tickets" style={navItemStyle}>Vé của tôi</Link>}
      </div>

      <div style={actionStyle}>
        <Search size={20} style={{ cursor: 'pointer' }} />
        
        {/* Chỉ hiện nút Quản trị nếu user có role là admin */}
        {user?.role === 'admin' && (
          <Link to="/admin" style={adminLinkStyle}>
            <LayoutDashboard size={20} />
            <span style={{ fontSize: '14px' }}>Quản trị</span>
          </Link>
        )}

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#fff', fontSize: '14px' }}>Chào, {user.fullname}</span>
            <Link to="/change-password" style={{ color: '#fbbf24', cursor: 'pointer' }} title="Thay đổi mật khẩu">
              <Lock size={20} />
            </Link>
            <LogOut size={20} onClick={handleLogout} style={{ cursor: 'pointer', color: '#aaa' }} />
          </div>
        ) : (
          <Link to="/login" style={loginBtnStyle}>
            <User size={20} /> Đăng nhập
          </Link>
        )}
      </div>
    </nav>
  );
};

// Styles (Có thể tách ra file CSS riêng)
const navStyle = { display: 'flex', justifyContent: 'space-between', padding: '15px 5%', background: '#111', color: 'white', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 2px 10px rgba(0,0,0,0.5)' };
const logoStyle = { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px', fontWeight: 'bold', color: '#e50914', textDecoration: 'none' };
const menuStyle = { display: 'flex', gap: '30px' };
const navItemStyle = { color: 'white', textDecoration: 'none', fontSize: '16px', fontWeight: '500' };
const actionStyle = { display: 'flex', gap: '20px', alignItems: 'center' };
const adminLinkStyle = { color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none' };
const loginBtnStyle = { display: 'flex', alignItems: 'center', gap: '5px', color: 'white', textDecoration: 'none', background: '#e50914', padding: '8px 15px', borderRadius: '5px' };

export default Header;
