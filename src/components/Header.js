import React, { useState } from 'react';
import { Film, User, LayoutDashboard, LogOut, Lock, Menu, X } from 'lucide-react';
import './Header.css';
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

  const [open, setOpen] = useState(false);

  return (
    <nav className="site-nav">
      <div className="nav-left">
        <Link to="/" className="nav-logo">
          <Film size={28} /> <span className="logo-text">TTV CINEMA</span>
        </Link>
      </div>

      <button className="nav-toggle" aria-label="Mở menu" onClick={() => setOpen(s => !s)}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className={`nav-center ${open ? 'open' : ''}`}>
        <Link to="/" className="nav-item">Trang chủ</Link>
        <Link to="/movies" className="nav-item">Phim</Link>
        {user && <Link to="/my-tickets" className="nav-item">Vé của tôi</Link>}
      </div>

      <div className={`nav-right ${open ? 'open' : ''}`}>

        {user?.role === 'admin' && (
          <Link to="/admin" className="nav-item admin-link">
            <LayoutDashboard size={18} />
            <span>Quản trị</span>
          </Link>
        )}

        {user ? (
          <div className="user-actions">
            <span className="greeting">Chào, {user.fullname}</span>
            <Link to="/change-password" className="icon-btn" title="Thay đổi mật khẩu">
              <Lock size={18} />
            </Link>
            <button className="icon-btn" onClick={handleLogout} title="Đăng xuất"><LogOut size={18} /></button>
          </div>
        ) : (
          <Link to="/login" className="login-btn">
            <User size={16} /> Đăng nhập
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Header;
