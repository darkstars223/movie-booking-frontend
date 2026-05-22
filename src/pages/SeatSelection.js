import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SeatSelection.css';

const SeatSelection = () => {
    const { showtimeId } = useParams();
    const navigate = useNavigate();
    const [seats, setSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [showtimeInfo, setShowtimeInfo] = useState(null);

    useEffect(() => {
        axios.get(`/movies/showtime/${showtimeId}`)
            .then(res => setShowtimeInfo(res.data))
            .catch(err => console.error("Lỗi tải thông tin", err));

        axios.get(`/movies/seats/${showtimeId}`)
            .then(res => setSeats(res.data))
            .catch(err => console.error("Lỗi tải ghế", err));
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
            const rowLetter = seat.seat_number.charAt(0);
            if (!rows[rowLetter]) rows[rowLetter] = [];
            rows[rowLetter].push(seat);
        });
        return rows;
    };

    const handleBooking = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                alert("Vui lòng đăng nhập!");
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
                alert("Đặt vé thành công!");
                navigate('/my-tickets');
            }
        } catch (error) {
            alert("Ghế đã có người đặt!");
        }
    };

    const groupedSeats = groupSeatsByRow(seats);
    const totalPrice = selectedSeats.length * (showtimeInfo?.price || 0);

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
            </div>

            <div className="seats-layout-wrapper">
                {Object.keys(groupedSeats).sort().map(rowLabel => (
                    <div key={rowLabel} className="seat-row">
                        <div className="row-name">{rowLabel}</div>
                        <div className="row-seats">
                            {groupedSeats[rowLabel].map(seat => (
                                <div
                                    key={seat.id}
                                    className={`seat-box ${seat.is_booked ? 'booked' : ''} ${selectedSeats.find(s => s.id === seat.id) ? 'selected' : ''}`}
                                    onClick={() => toggleSeat(seat)}
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
                <button 
                    className="btn-booking-confirm" 
                    disabled={selectedSeats.length === 0}
                    onClick={handleBooking}
                >
                    XÁC NHẬN ĐẶT VÉ
                </button>
            </div>
        </div>
    );
};

export default SeatSelection;