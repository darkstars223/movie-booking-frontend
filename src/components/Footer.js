import React from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-inner container">
        <div className="footer-col">
          <h4>TTV CINEMA</h4>
          <p>Địa chỉ: 123 Example Street, Thành phố</p>
          <p>Hotline: 1900-123-456</p>
        </div>
        <div className="footer-col">
          <h4>Liên kết</h4>
          <ul>
            <li><Link to="/">Trang chủ</Link></li>
            <li><Link to="/movies">Phim</Link></li>
            <li><Link to="/my-tickets">Vé của tôi</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Hỗ trợ</h4>
          <ul>
            <li><Link to="/refund-policy">Chính sách hoàn tiền</Link></li>
            <li><Link to="/help/buying">Hướng dẫn mua vé</Link></li>
            <li><Link to="/contact">Liên hệ</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} TTV CINEMA. All rights reserved.</div>
    </footer>
  );
};

export default Footer;
