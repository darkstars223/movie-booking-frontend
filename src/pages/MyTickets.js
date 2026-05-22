import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import './MyTickets.css';

// Cập nhật trạng thái thành 'cancel' và 'expire'
const statusLabels = {
  pending: 'Chờ thanh toán',
  confirmed: 'Đã xác nhận',
  cancel: ' Đã hủy',
  expire: ' Đã hết hạn'
};

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // State lưu thời gian thực để chạy đếm ngược
  const [currentTime, setCurrentTime] = useState(new Date());

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  // Cập nhật currentTime mỗi giây
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchUserTickets = useCallback(async () => {
    if (!userId) {
      console.warn('⚠️ User ID not found - user not logged in');
      setError('Không tìm thấy user ID. Vui lòng đăng nhập lại.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/bookings/user/${userId}`);
      setTickets(response.data || []);
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách vé: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserTickets();
  }, [fetchUserTickets]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchUserTickets();
    }, 300000);
    return () => clearInterval(interval);
  }, [fetchUserTickets]);

  useEffect(() => {
    let interval;
    if (showModal && selectedTicket && selectedTicket.status === 'pending') {
      interval = setInterval(async () => {
        try {
          const response = await api.get(`/bookings/detail/${selectedTicket.id}`);
          if (response.data.status === 'confirmed') {
            setSelectedTicket(response.data); 
            fetchUserTickets(); 
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Lỗi kiểm tra trạng thái vé");
        }
      }, 5000); 
    }
    return () => clearInterval(interval);
  }, [showModal, selectedTicket, fetchUserTickets]);

  const handleShowDetails = (ticket) => {
    setSelectedTicket(ticket);
    setShowModal(true);
  };

  const handleCancelTicket = async (ticketId) => {
    if (!window.confirm('Bạn có chắc muốn hủy yêu cầu đặt vé này không?')) return;
    try {
      await api.put(`/bookings/cancel/${ticketId}`);
      alert('Đã hủy yêu cầu đặt vé.');
      fetchUserTickets();
      if (showModal) setShowModal(false);
    } catch (err) {
      alert('Không thể hủy vé.');
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  };

  const getStatusLabel = (status) => statusLabels[status] || status;
  const filteredTickets = tickets.filter(ticket => filter === 'all' || ticket.status === filter);

  // Hàm render giao diện đếm ngược 10 phút
  const renderCountdown = (bookingTimeStr) => {
    const bookingTime = new Date(bookingTimeStr).getTime();
    const expireTime = bookingTime + 10 * 60000; 
    const timeLeft = expireTime - currentTime.getTime();

    if (timeLeft > 0) {
      const mins = Math.floor(timeLeft / 60000);
      const secs = Math.floor((timeLeft % 60000) / 1000);
      return <span style={{color: '#e50914', fontWeight: 'bold'}}> (Hủy sau {mins}:{secs < 10 ? '0' : ''}{secs})</span>;
    } else {
      return <span style={{color: 'gray'}}> (Đang xử lý hủy...)</span>;
    }
  };

  if (loading) return <div className="my-tickets-container"><p>Đang tải...</p></div>;

  return (
    <div className="my-tickets-page">
      <div className="my-tickets-container">
        <h1>Vé của tôi</h1>

        {error && <div className="error-message">{error}</div>}

        <div className="filter-section">
          {/* Thêm filter 'expire' vào danh sách */}
          {['all', 'pending', 'confirmed', 'cancel', 'expire'].map(type => (
            <button
              key={type}
              className={`filter-btn ${filter === type ? 'active' : ''}`}
              onClick={() => setFilter(type)}
            >
              {type === 'all' ? 'Tất cả' : getStatusLabel(type)}
            </button>
          ))}
        </div>

        <div className="tickets-list">
          {filteredTickets.length === 0 ? (
            <div className="no-tickets">
              <p>Không có vé nào trong mục này.</p>
            </div>
          ) : filteredTickets.map(ticket => {
            
            // Check nếu thời gian đếm ngược cục bộ đã hết nhưng backend chưa kịp update
            const isPendingExpired = ticket.status === 'pending' && (new Date(ticket.booking_time).getTime() + 10 * 60000 <= currentTime.getTime());

            return (
              <div key={ticket.id} className="ticket-card" data-status={ticket.status}>
                <div className="ticket-header">
                  <div className="movie-info">
                    <img
                      src={ticket.poster_url?.startsWith('http') ? ticket.poster_url : (ticket.poster_url ? `http://localhost:5000${ticket.poster_url}` : '')}
                      alt={ticket.title}
                      className="movie-poster"
                    />
                    <div className="movie-details">
                      <h3 className="movie-title">{ticket.title}</h3>
                      <p><strong>Suất chiếu:</strong> {formatDateTime(ticket.start_time)}</p>
                      
                      {/* Đổi nhãn thành Kết thúc dự kiến */}
                      <p><strong>Kết thúc dự kiến:</strong> {formatDateTime(ticket.end_time)}</p>
                      
                      {/* Thêm hiển thị Phòng chiếu */}
                      <p><strong>Phòng chiếu:</strong> {ticket.room_name || 'Phòng 01'} - <strong>Ghế:</strong> {ticket.seat_number}</p>
                      
                      <span className="status-chip" data-status={ticket.status}>
                        {getStatusLabel(ticket.status)}
                        {/* Gọi hàm đếm ngược nếu trạng thái đang chờ thanh toán */}
                        {ticket.status === 'pending' && renderCountdown(ticket.booking_time)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ticket-actions">
                  <button className="btn-details" onClick={() => handleShowDetails(ticket)}>Chi tiết</button>
                  {ticket.status === 'pending' && (
                    <>
                      {/* Chỉ hiện nút thanh toán nếu còn thời gian đếm ngược */}
                      {!isPendingExpired && (
                        <button 
                          className="btn-pay" 
                          onClick={() => navigate(`/payment/${ticket.id}`)}
                          style={{ backgroundColor: '#e50914', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginLeft: '8px' }}
                        >
                          Thanh toán
                        </button>
                      )}
                      <button className="btn-cancel" onClick={() => handleCancelTicket(ticket.id)} style={{ marginLeft: '8px' }}>
                        Hủy
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && selectedTicket && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ticket-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowModal(false)}>&times;</button>

            <div className="modal-content">
              <div className="ticket-visual">
                <div className="ticket-left">
                  <h2>{selectedTicket.title}</h2>
                  <div className="info-grid">
                    <div><label>Ngày chiếu</label><p>{formatDate(selectedTicket.start_time)}</p></div>
                    <div><label>Giờ chiếu</label><p>{formatTime(selectedTicket.start_time)}</p></div>
                    
                    {/* Đổi nhãn Hạn vé thành Kết thúc */}
                    <div><label>Kết thúc</label><p>{formatTime(selectedTicket.end_time)}</p></div>
                    
                    {/* Render chính xác tên phòng lấy từ DB */}
                    <div><label>Phòng</label><p>{selectedTicket.room_name || 'Phòng 01'}</p></div>
                    <div><label>Ghế</label><p>{selectedTicket.seat_number}</p></div>
                    <div><label>Rạp</label><p>{selectedTicket.theater_name || 'TTV CINEMA'}</p></div>
                    <div><label>Giá vé</label><p>{Number(selectedTicket.total_price || 0).toLocaleString()} đ</p></div>
                    <div><label>Trạng thái</label><p>{getStatusLabel(selectedTicket.status)}</p></div>
                  </div>
                </div>

                <div className="ticket-right">
                  {/* Logic render mã QR hoặc thông báo tùy trạng thái */}
                  {selectedTicket.status === 'confirmed' ? (
                    <div className="qr-code">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TICKET-${selectedTicket.id}`} alt="QR" />
                      <p>#{selectedTicket.id}</p>
                    </div>
                  ) : selectedTicket.status === 'expire' ? (
                    <div className="payment-waiting">
                      <strong style={{color: 'gray'}}>{getStatusLabel(selectedTicket.status)}</strong>
                      <p>Suất chiếu này đã kết thúc.</p>
                    </div>
                  ) : (
                    <div className="payment-waiting">
                      <strong>{getStatusLabel(selectedTicket.status)}</strong>
                      <p>QR sẽ hiển thị sau khi thanh toán được xác nhận.</p>
                    </div>
                  )}
                  <div className="status-badge" data-status={selectedTicket.status}>
                    {getStatusLabel(selectedTicket.status)}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <p>
                  {/* Cập nhật thông báo ghi chú footer theo 3 trạng thái chính */}
                  {selectedTicket.status === 'confirmed'
                    ? '* Vé có hiệu lực đến hết thời gian suất chiếu. Vui lòng xuất trình mã QR tại quầy.'
                    : selectedTicket.status === 'expire'
                    ? '* Vé đã hết hạn sử dụng.'
                    : '* Vé đang giữ chỗ và chờ xác nhận thanh toán.'}
                </p>
                {selectedTicket.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className="btn-pay-modal" 
                      onClick={() => navigate(`/payment/${selectedTicket.id}`)}
                      style={{ backgroundColor: '#e50914', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Thanh toán ngay
                    </button>
                    
                    <button className="btn-cancel-modal" onClick={() => handleCancelTicket(selectedTicket.id)}>
                      Hủy yêu cầu này
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTickets;