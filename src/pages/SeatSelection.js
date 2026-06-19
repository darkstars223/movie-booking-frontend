import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import './SeatSelection.css';

const SeatSelection = () => {
    const { showtimeId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [seats, setSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [showtimeInfo, setShowtimeInfo] = useState(null);

    const isShowtimePast = showtimeInfo?.start_time
        ? new Date(showtimeInfo.start_time).getTime() <= Date.now()
        : false;

    useEffect(() => {
    // Gọi API lấy thông tin suất chiếu
    api.get(`/movies/showtime/${showtimeId}`)
        .then(res => setShowtimeInfo(res.data))
        .catch(err => console.error("Lỗi tải thông tin", err));

    // Gọi API lấy ghế
    api.get(`/movies/seats/${showtimeId}`)
        .then(res => {
            // Kiểm tra: Nếu response là array thì set, nếu không thì set mảng rỗng
            if (Array.isArray(res.data)) {
                setSeats(res.data);
            } else {
                setSeats([]); 
                console.warn("Dữ liệu ghế không phải là mảng:", res.data);
            }
        })
        .catch(err => {
            console.error("Lỗi tải ghế", err);
            setSeats([]); // Set mảng rỗng khi có lỗi để tránh crash
        });
}, [showtimeId]);

    const toggleSeat = (seat) => {
        if (seat.is_booked) return;
        if (selectedSeats.find(s => s.id === seat.id)) {
            setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
        } else {
            setSelectedSeats([...selectedSeats, seat]);
        }
    };

    // Hàm nhóm ghế theo hàng A, B, C...
    const groupSeatsByRow = (allSeats) => {
        const rows = {};
        allSeats.forEach(seat => {
            const sn = String(seat.seat_number || '');
            // Try extract leading letters (e.g., A12 -> A)
            const m = sn.match(/^([A-Za-z]+)/);
            let rowLetter = '';
            if (m && m[1]) rowLetter = m[1].toUpperCase();
            else if (seat.row) rowLetter = String(seat.row);
            else rowLetter = sn.charAt(0) || '?';

            if (!rows[rowLetter]) rows[rowLetter] = [];
            rows[rowLetter].push(seat);
        });

        // Sort seats within each row by trailing number if present
        Object.keys(rows).forEach(r => {
            rows[r].sort((a, b) => {
                const an = String(a.seat_number || '').match(/(\d+)$/);
                const bn = String(b.seat_number || '').match(/(\d+)$/);
                const ai = an ? parseInt(an[1], 10) : 0;
                const bi = bn ? parseInt(bn[1], 10) : 0;
                return ai - bi;
            });
        });
        return rows;
    };

    const handleBooking = async () => {
        if (isShowtimePast) {
            toast.warning("Suất chiếu đã qua. Không thể đặt vé nữa.");
            return;
        }

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                toast.info("Vui lòng đăng nhập!");
                navigate('/login');
                return;
            }
            const bookingData = {
                user_id: user.id,
                showtime_id: parseInt(showtimeId),
                seat_ids: selectedSeats.map(s => s.id),
                total_price: selectedSeats.length * (showtimeInfo?.price || 0)
            };
            const response = await api.post('/bookings/create', bookingData);
            if (response.status === 201) {
                toast.success("Đặt vé thành công!");
                navigate('/my-tickets');
            }
        } catch (error) {
            toast.error("Ghế đã có người đặt!");
        }
    };

    const groupedSeats = groupSeatsByRow(seats);
    const totalPrice = selectedSeats.reduce((acc, s) => {
        const base = Number(showtimeInfo?.price || 0);
        const multiplier = s.is_vip ? 1.1 : 1.0; // VIP +10%
        return acc + base * multiplier;
    }, 0);

    return (
        <div className="seat-selection-container">
            <div className="movie-header">
                <h2 className="movie-title">{showtimeInfo?.title || 'Đang tải...'}</h2>
                <div className="movie-meta">
                    <span className="theater-name">{showtimeInfo?.theater_name}</span>
                    <span className="meta-dot" />
                    <span>Phòng {showtimeInfo?.room_name}</span>
                    <span className="meta-dot" />
                    <span className="price-tag">{Number(showtimeInfo?.price || 0).toLocaleString()} đ/ghế</span>
                </div>
            </div>

            <div className="screen-container">
                <div className="screen" />
                <p className="screen-label">MÀN HÌNH</p>
            </div>

            <div className="legend">
                <div className="legend-item">
                    <div className="legend-dot available" />
                    <span>Còn trống</span>
                </div>
                <div className="legend-item">
                    <div className="legend-dot selected" />
                    <span>Đang chọn</span>
                </div>
                <div className="legend-item">
                    <div className="legend-dot booked" />
                    <span>Đã đặt</span>
                </div>
                <div className="legend-item">
                    <div className="legend-dot vip" />
                    <span>VIP (+10%)</span>
                </div>
            </div>

            <div className="seats-layout-wrapper">
                {Object.keys(groupedSeats).sort().map(rowLabel => (
                    <div key={rowLabel} className="seat-row">
                        <div className="row-name">{rowLabel}</div>
                        <div className="row-seats">
                            {groupedSeats[rowLabel].map(seat => (
                                <div
                                    key={seat.id}
                                    className={`seat-box ${seat.is_booked ? 'booked' : ''} ${seat.is_vip ? 'vip' : ''} ${selectedSeats.find(s => s.id === seat.id) ? 'selected' : ''}${isShowtimePast ? ' disabled' : ''}`}
                                    onClick={() => !isShowtimePast && toggleSeat(seat)}
                                    title={seat.is_vip ? 'VIP (+10%)' : ''}
                                >
                                    {seat.seat_number.substring(1)}
                                </div>
                            ))}
                        </div>
                        <div className="row-name">{rowLabel}</div>
                    </div>
                ))}
            </div>

            <div className="booking-footer-card">
                <div className="summary-info">
                    <div className="summary-item">
                        <label>Ghế chọn:</label>
                        <span>{selectedSeats.length > 0 ? selectedSeats.map(s => s.seat_number).join(', ') : '---'}</span>
                    </div>
                    <div className="summary-item">
                        <label>Tạm tính:</label>
                        <span className="total-price-text">{totalPrice.toLocaleString()} VNĐ</span>
                    </div>
                </div>
                {isShowtimePast && (
                    <div className="expired-message" style={{ color: '#d00', marginBottom: '12px' }}>
                        Suất chiếu đã qua. Không thể đặt vé nữa.
                    </div>
                )}
                <button 
                    className="btn-booking-confirm" 
                    disabled={selectedSeats.length === 0 || isShowtimePast}
                    onClick={handleBooking}
                >
                    XÁC NHẬN ĐẶT VÉ
                </button>
            </div>
        </div>
    );
};

export default SeatSelection;