import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './Payment.css'; // Bạn có thể tạo file CSS sau để làm đẹp

const Payment = () => {
  const { id } = useParams(); // Lấy ID vé từ URL
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // 1. Lấy thông tin vé để lấy số tiền cần thanh toán
  useEffect(() => {
    const fetchTicketDetail = async () => {
      try {
        const response = await api.get(`/bookings/detail/${id}`);
        setTicket(response.data);
        setLoading(false);
      } catch (err) {
        setError('Không thể lấy thông tin vé.');
        setLoading(false);
      }
    };
    fetchTicketDetail();
  }, [id]);

  // 2. Tự động kiểm tra trạng thái thanh toán mỗi 3 giây
  useEffect(() => {
    let interval;
    if (ticket && ticket.status === 'pending' && !isSuccess) {
      interval = setInterval(async () => {
        try {
          const response = await api.get(`/bookings/detail/${id}`);
          if (response.data.status === 'confirmed') {
            setIsSuccess(true);
            clearInterval(interval);
            
            // Chuyển hướng về trang vé của tôi sau 3 giây
            setTimeout(() => {
              navigate('/my-tickets');
            }, 3000);
          }
        } catch (error) {
          console.error("Lỗi kiểm tra trạng thái:", error);
        }
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [ticket, id, navigate, isSuccess]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Đang tải thông tin thanh toán...</div>;
  if (error) return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>{error}</div>;
  if (!ticket) return null;

  // Cấu hình URL tạo mã VietQR tự động
   
  const bankID = "MB";  
  const accountNo = "0826416461"; 
  const accountName = "TRAN THE VINH";  
  const amount = ticket.total_price;
  const transferContent = `TK${id}`;  
  
  const qrUrl = `https://img.vietqr.io/image/${bankID}-${accountNo}-compact2.png?amount=${amount}&addInfo=${transferContent}&accountName=${accountName}`;

  return (
    <div className="payment-page" style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h1>Thanh Toán Vé Xem Phim</h1>
      
      {isSuccess ? (
        <div className="success-message" style={{ backgroundColor: '#4CAF50', color: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
          <h2>🎉 Thanh toán thành công!</h2>
          <p>Hệ thống đã xác nhận thanh toán của bạn.</p>
          <p>Đang chuyển hướng về trang quản lý vé...</p>
        </div>
      ) : (
        <div className="payment-content" style={{ backgroundColor: '#222', padding: '30px', borderRadius: '10px', marginTop: '20px' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
            Phim: <strong>{ticket.title}</strong>
          </p>
          <p style={{ fontSize: '1.5rem', color: '#e50914', fontWeight: 'bold' }}>
            Số tiền: {Number(amount).toLocaleString()} VNĐ
          </p>

          <div className="qr-container" style={{ margin: '20px 0', background: 'white', padding: '15px', borderRadius: '8px', display: 'inline-block' }}>
            <img src={qrUrl} alt="Mã QR Thanh Toán" style={{ width: '250px', height: '250px' }} />
          </div>

          <div className="transfer-info" style={{ textAlign: 'left', backgroundColor: '#333', padding: '15px', borderRadius: '8px' }}>
            <p><strong>Ngân hàng:</strong> {bankID}</p>
            <p><strong>Số tài khoản:</strong> {accountNo}</p>
            <p><strong>Chủ tài khoản:</strong> {accountName}</p>
            <p style={{ color: '#ffeb3b', fontSize: '1.1rem' }}>
              <strong>Nội dung chuyển khoản (BẮT BUỘC):</strong> {transferContent}
            </p>
          </div>
          
          <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#aaa' }}>
            <p>Mở ứng dụng ngân hàng và quét mã QR để thanh toán.</p>
            <p>Trang sẽ tự động cập nhật ngay khi bạn chuyển khoản thành công!</p>
          </div>

          <button 
            onClick={() => navigate('/my-tickets')} 
            style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: 'transparent', color: 'white', border: '1px solid white', borderRadius: '5px', cursor: 'pointer' }}
          >
            Quay lại
          </button>
        </div>
      )}
    </div>
  );
};

export default Payment;