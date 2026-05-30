import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Eye, EyeOff } from 'lucide-react';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));

  // Redirect nếu chưa đăng nhập
  React.useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validation
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('Vui lòng điền đầy đủ tất cả trường');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.oldPassword === formData.newPassword) {
      setError('Mật khẩu mới phải khác mật khẩu cũ');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/auth/change-password', {
        userId: user.id,
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });

      setMessage(response.data.message);
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Redirect về trang chủ sau 2 giây
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={formContainerStyle}>
        <div style={headerStyle}>
          <Lock size={32} style={{ color: '#e50914' }} />
          <h1 style={titleStyle}>Thay Đổi Mật Khẩu</h1>
        </div>

        {message && <div style={successStyle}>{message}</div>}
        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit} style={formStyle}>
          {/* Mật khẩu cũ */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>Mật khẩu cũ:</label>
            <div style={passwordInputContainerStyle}>
              <input
                type={showPasswords.old ? 'text' : 'password'}
                name="oldPassword"
                value={formData.oldPassword}
                onChange={handleChange}
                placeholder="Nhập mật khẩu cũ"
                style={inputStyle}
              />
              <span
                onClick={() => togglePasswordVisibility('old')}
                style={eyeIconStyle}
              >
                {showPasswords.old ? <EyeOff size={20} /> : <Eye size={20} />}
              </span>
            </div>
          </div>

          {/* Mật khẩu mới */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>Mật khẩu mới:</label>
            <div style={passwordInputContainerStyle}>
              <input
                type={showPasswords.new ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Nhập mật khẩu mới"
                style={inputStyle}
              />
              <span
                onClick={() => togglePasswordVisibility('new')}
                style={eyeIconStyle}
              >
                {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
              </span>
            </div>
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>Xác nhận mật khẩu mới:</label>
            <div style={passwordInputContainerStyle}>
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu mới"
                style={inputStyle}
              />
              <span
                onClick={() => togglePasswordVisibility('confirm')}
                style={eyeIconStyle}
              >
                {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </span>
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...submitBtnStyle,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Đang xử lý...' : 'Thay Đổi Mật Khẩu'}
          </button>
        </form>

        <button
          onClick={() => navigate(-1)}
          style={backBtnStyle}
        >
          ← Quay Lại
        </button>
      </div>
    </div>
  );
};

// Styles
const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#141414',
  padding: '20px',
};

const formContainerStyle = {
  backgroundColor: '#222',
  padding: '40px',
  borderRadius: '10px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  width: '100%',
  maxWidth: '400px',
};

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '15px',
  marginBottom: '30px',
};

const titleStyle = {
  fontSize: '28px',
  color: 'white',
  margin: '0',
  fontWeight: 'bold',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const labelStyle = {
  color: '#aaa',
  fontSize: '14px',
  fontWeight: '500',
};

const passwordInputContainerStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const inputStyle = {
  width: '100%',
  padding: '12px 40px 12px 15px',
  backgroundColor: '#333',
  border: '1px solid #555',
  borderRadius: '5px',
  color: 'white',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.3s',
};

const eyeIconStyle = {
  position: 'absolute',
  right: '12px',
  cursor: 'pointer',
  color: '#aaa',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.3s',
};

const submitBtnStyle = {
  padding: '12px',
  backgroundColor: '#e50914',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  fontSize: '16px',
  fontWeight: 'bold',
  marginTop: '10px',
  transition: 'background-color 0.3s',
};

const backBtnStyle = {
  padding: '10px',
  backgroundColor: 'transparent',
  color: '#aaa',
  border: '1px solid #555',
  borderRadius: '5px',
  fontSize: '14px',
  cursor: 'pointer',
  marginTop: '10px',
  transition: 'all 0.3s',
};

const successStyle = {
  backgroundColor: '#10b981',
  color: 'white',
  padding: '12px',
  borderRadius: '5px',
  marginBottom: '20px',
  textAlign: 'center',
};

const errorStyle = {
  backgroundColor: '#ef4444',
  color: 'white',
  padding: '12px',
  borderRadius: '5px',
  marginBottom: '20px',
  textAlign: 'center',
};

export default ChangePassword;
