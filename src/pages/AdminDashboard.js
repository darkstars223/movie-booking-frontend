import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Plus } from 'lucide-react';
import { formatDateOnly } from '../utils/date';

const toTimeInputValue = (value) => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const pad = (number) => String(number).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toDateInputFromDateTime = (value) => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const pad = (number) => String(number).padStart(2, '0');
    return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate())
    ].join('-');
};

const buildDateTimeValue = (dateValue, timeValue) => {
    if (!dateValue || !timeValue) return '';

    const datePart = String(dateValue).slice(0, 10);
    return `${datePart} ${timeValue}:00`;
};

const addMinutesToDateTimeValue = (dateTimeValue, minutes) => {
    if (!dateTimeValue || !minutes) return null;

    const normalized = dateTimeValue.replace(' ', 'T');
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return null;

    date.setMinutes(date.getMinutes() + Number(minutes));

    const pad = (number) => String(number).padStart(2, '0');
    return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate())
    ].join('-') + ` ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
};

const formatDateTimePreview = (dateTimeValue) => {
    if (!dateTimeValue) return '';

    const date = new Date(dateTimeValue.replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour12: false
    });
};

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('movies');
    const [movies, setMovies] = useState([]);
    const [theaters, setTheaters] = useState([]);
    const [showtimes, setShowtimes] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [theaterForm, setTheaterForm] = useState({ name: '', capacity: '' });
    const [editingTheater, setEditingTheater] = useState(null);
    const [showtimeForm, setShowtimeForm] = useState({ movie_id: '', theater_id: '', room_name: '', show_date: '', start_time: '', price: '' });
    const [editingShowtime, setEditingShowtime] = useState(null);
    const [seatShowtimeId, setSeatShowtimeId] = useState('');
    const [seats, setSeats] = useState([]);
    const [seatsToAdd, setSeatsToAdd] = useState('');
    const [seatsToDelete, setSeatsToDelete] = useState('');
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const fetchMovies = () => {
        api.get('/movies').then(res => setMovies(res.data));
    };

    const fetchTheaters = () => {
        api.get('/admin/theaters').then(res => setTheaters(res.data));
    };

    const fetchShowtimes = () => {
        api.get('/admin/showtimes').then(res => setShowtimes(res.data));
    };

    const fetchBookings = () => {
        api.get('/admin/bookings').then(res => setBookings(res.data));
    };

    const fetchSeats = async (showtimeId) => {
        if (!showtimeId) return;
        try {
            const res = await api.get(`/admin/seats/showtime/${showtimeId}`);
            setSeats(res.data);
        } catch (err) {
            console.error(err);
            setSeats([]);
        }
    };

    const selectedShowtimeMovie = movies.find(movie => String(movie.id) === String(showtimeForm.movie_id));
    const showtimeStartPreview = buildDateTimeValue(showtimeForm.show_date, showtimeForm.start_time);
    const showtimeEndPreview = addMinutesToDateTimeValue(showtimeStartPreview, selectedShowtimeMovie?.duration);

    useEffect(() => {
        if (user?.role !== 'admin') {
            alert("Bạn không có quyền truy cập!");
            navigate('/');
        }
        fetchMovies();
        fetchTheaters();
        fetchShowtimes();
        fetchBookings();
    }, [user?.role, navigate]);

    const handleDeleteMovie = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa phim này?")) {
            try {
                await api.delete(`/admin/movies/delete/${id}?userId=${user.id}`);
                alert('Xóa phim thành công!');
                fetchMovies();
            } catch (err) {
                alert('Lỗi xóa phim: ' + (err.response?.data?.message || err.message));
            }
        }
    };

    const handleDeleteTheater = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa theater này?")) {
            try {
                await api.delete(`/admin/theaters/delete/${id}?userId=${user.id}`);
                alert('Xóa theater thành công!');
                fetchTheaters();
            } catch (err) {
                alert('Lỗi xóa theater: ' + (err.response?.data?.message || err.message));
            }
        }
    };

    const handleDeleteShowtime = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa showtime này?")) {
            try {
                await api.delete(`/admin/showtimes/delete/${id}?userId=${user.id}`);
                alert('Xóa showtime thành công!');
                fetchShowtimes();
            } catch (err) {
                alert('Lỗi xóa showtime: ' + (err.response?.data?.message || err.message));
            }
        }
    };

    const resetTheaterForm = () => {
        setTheaterForm({ name: '', capacity: '' });
        setEditingTheater(null);
    };

    const handleSubmitTheater = async (e) => {
        e.preventDefault();
        try {
            if (editingTheater) {
                await api.put(`/admin/theaters/edit/${editingTheater.id}`, {
                    ...theaterForm,
                    userId: user.id
                });
                alert('Cập nhật phòng chiếu thành công');
            } else {
                await api.post('/admin/theaters/add', {
                    ...theaterForm,
                    userId: user.id
                });
                alert('Thêm phòng chiếu thành công');
            }
            resetTheaterForm();
            fetchTheaters();
        } catch (err) {
            alert('Lỗi: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleEditTheater = (theater) => {
        setEditingTheater(theater);
        setTheaterForm({ name: theater.name, capacity: theater.capacity });
    };

    const resetShowtimeForm = () => {
        setShowtimeForm({ movie_id: '', theater_id: '', room_name: '', show_date: '', start_time: '', price: '' });
        setEditingShowtime(null);
    };

    const handleSubmitShowtime = async (e) => {
        e.preventDefault();
        try {
            const selectedMovie = movies.find(movie => String(movie.id) === String(showtimeForm.movie_id));
            if (!selectedMovie?.release_date) {
                alert('Vui lòng cập nhật ngày khởi chiếu của phim trước khi thêm suất chiếu.');
                return;
            }

            if (!showtimeForm.show_date || !showtimeForm.start_time) {
                alert('Vui lòng chọn ngày chiếu và giờ bắt đầu suất chiếu.');
                return;
            }

            if (showtimeForm.show_date < selectedMovie.release_date) {
                alert('Ngày chiếu không được trước ngày khởi chiếu của phim.');
                return;
            }

            const startDateTime = buildDateTimeValue(showtimeForm.show_date, showtimeForm.start_time);
            const payload = {
                ...showtimeForm,
                start_time: startDateTime,
                end_time: addMinutesToDateTimeValue(startDateTime, selectedMovie.duration),
                userId: user.id
            };

            if (editingShowtime) {
                await api.put(`/admin/showtimes/edit/${editingShowtime.id}`, payload);
                alert('Cập nhật suất chiếu thành công');
            } else {
                await api.post('/admin/showtimes/add', payload);
                alert('Thêm suất chiếu thành công');
            }
            resetShowtimeForm();
            fetchShowtimes();
        } catch (err) {
            alert('Lỗi: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleEditShowtime = (showtime) => {
        setEditingShowtime(showtime);
        setShowtimeForm({
            movie_id: showtime.movie_id,
            theater_id: showtime.theater_id,
            room_name: showtime.room_name || '',
            show_date: toDateInputFromDateTime(showtime.start_time),
            start_time: toTimeInputValue(showtime.start_time),
            price: showtime.price || ''
        });
    };

    const handleSelectSeatShowtime = async (showtimeId) => {
        setSeatShowtimeId(showtimeId);
        await fetchSeats(showtimeId);
    };

    const handleToggleSeat = async (seat) => {
        try {
            await api.put(`/admin/seats/edit/${seat.id}`, {
                is_booked: !seat.is_booked,
                userId: user.id
            });
            await fetchSeats(seat.showtime_id);
        } catch (err) {
            alert('Lỗi cập nhật ghế: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleGenerateSeats = async () => {
        if (!seatShowtimeId) {
            alert('Vui lòng chọn suất chiếu trước.');
            return;
        }
        if (!seatsToAdd || parseInt(seatsToAdd) <= 0) {
            alert('Vui lòng nhập số lượng ghế muốn thêm.');
            return;
        }
        try {
            await api.post(`/admin/seats/generate/showtime/${seatShowtimeId}`, { 
                userId: user.id,
                numberOfSeats: parseInt(seatsToAdd)
            });
            await fetchSeats(seatShowtimeId);
            setSeatsToAdd('');
            alert('Thêm ghế thành công.');
        } catch (err) {
            alert('Lỗi thêm ghế: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteSeats = async () => {
        if (!seatShowtimeId) {
            alert('Vui lòng chọn suất chiếu trước.');
            return;
        }
        if (!seatsToDelete || parseInt(seatsToDelete) <= 0) {
            alert('Vui lòng nhập số lượng ghế muốn xóa.');
            return;
        }
        if (window.confirm(`Bạn có chắc chắn muốn xóa ${seatsToDelete} ghế cho suất chiếu này?`)) {
            try {
                await api.delete(`/admin/seats/delete/showtime/${seatShowtimeId}?userId=${user.id}&count=${parseInt(seatsToDelete)}`);
                await fetchSeats(seatShowtimeId);
                setSeatsToDelete('');
                alert('Xóa ghế thành công.');
            } catch (err) {
                alert('Lỗi xóa ghế: ' + (err.response?.data?.message || err.message));
            }
        }
    };

    const handleConfirmBooking = async (bookingId) => {
        try {
            await api.put(`/admin/bookings/confirm/${bookingId}`, { userId: user.id });
            alert('Đã xác nhận thanh toán vé.');
            fetchBookings();
        } catch (err) {
            alert('Lỗi xác nhận vé: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Bạn có chắc muốn hủy vé này?')) return;

        try {
            await api.put(`/bookings/cancel/${bookingId}`);
            alert('Đã hủy vé.');
            fetchBookings();
        } catch (err) {
            alert('Lỗi hủy vé: ' + (err.response?.data?.message || err.message));
        }
    };

    const bookingStatusLabel = (status) => {
        const labels = {
            pending: 'Chờ thanh toán',
            confirmed: 'Đã xác nhận',
            cancel: 'Đã hủy'
        };
        return labels[status] || status;
    };

    return (
        <div style={{ padding: '30px', color: 'white' }}>
            <div style={{ display: 'flex', marginBottom: '20px' }}>
                <button onClick={() => setActiveTab('movies')} style={tabStyle(activeTab === 'movies')}>Quản Lý Phim</button>
                <button onClick={() => setActiveTab('theaters')} style={tabStyle(activeTab === 'theaters')}>Quản Lý Phòng Chiếu</button>
                <button onClick={() => setActiveTab('showtimes')} style={tabStyle(activeTab === 'showtimes')}>Quản Lý Suất Chiếu</button>
                <button onClick={() => setActiveTab('seats')} style={tabStyle(activeTab === 'seats')}>Quản Lý Ghế</button>
                <button onClick={() => setActiveTab('bookings')} style={tabStyle(activeTab === 'bookings')}>Quản Lý Đặt Vé</button>
            </div>

            {activeTab === 'movies' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h2>Quản Lý Phim</h2>
                        <button onClick={() => navigate('/admin/add')} style={btnThêm}>
                            <Plus size={18} /> Thêm Phim Mới
                        </button>
                    </div>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #444' }}>
                                <th>ID</th>
                                <th>Poster</th>
                                <th>Tên phim</th>
                                <th>Thể loại</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movies.map(m => (
                                <tr key={m.id} style={{ borderBottom: '1px solid #333' }}>
                                    <td>{m.id}</td>
                                    <td><img src={m.poster_url?.startsWith('http') ? m.poster_url : `http://localhost:5000${m.poster_url}`} width="50" alt="" /></td>
                                    <td>{m.title}</td>
                                    <td>{m.genre}</td>
                                    <td>
                                        <Edit onClick={() => navigate(`/admin/edit/${m.id}`)} style={{ cursor: 'pointer', marginRight: '15px' }} color="gold" />
                                        <Trash2 onClick={() => handleDeleteMovie(m.id)} style={{ cursor: 'pointer' }} color="red" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'theaters' && (
                <div>
                    <h2>Quản Lý Phòng Chiếu</h2>
                    <form onSubmit={handleSubmitTheater} style={formStyle}>
                        <div style={formRow}>
                            <input
                                type="text"
                                placeholder="Tên phòng"
                                value={theaterForm.name}
                                onChange={(e) => setTheaterForm({ ...theaterForm, name: e.target.value })}
                                required
                                style={inputStyle}
                            />
                            <input
                                type="number"
                                min="1"
                                placeholder="Sức chứa"
                                value={theaterForm.capacity}
                                onChange={(e) => setTheaterForm({ ...theaterForm, capacity: e.target.value })}
                                required
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <button type="submit" style={btnThêm}>
                                {editingTheater ? 'Lưu phòng chiếu' : 'Thêm phòng chiếu'}
                            </button>
                            {editingTheater && (
                                <button type="button" onClick={resetTheaterForm} style={cancelBtn}>
                                    Hủy
                                </button>
                            )}
                        </div>
                    </form>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #444' }}>
                                <th>ID</th>
                                <th>Tên Phòng</th>
                                <th>Sức chứa</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {theaters.map(t => (
                                <tr key={t.id} style={{ borderBottom: '1px solid #333' }}>
                                    <td>{t.id}</td>
                                    <td>{t.name}</td>
                                    <td>{t.capacity}</td>
                                    <td>
                                        <Edit onClick={() => handleEditTheater(t)} style={{ cursor: 'pointer', marginRight: '15px' }} color="gold" />
                                        <Trash2 onClick={() => handleDeleteTheater(t.id)} style={{ cursor: 'pointer' }} color="red" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'showtimes' && (
                <div>
                    <h2>Quản Lý Suất Chiếu</h2>
                    <form onSubmit={handleSubmitShowtime} style={formStyle}>
                        <div style={formRow}>
                            <select
                                value={showtimeForm.movie_id}
                                onChange={(e) => {
                                    const movie = movies.find(m => String(m.id) === e.target.value);
                                    setShowtimeForm({
                                        ...showtimeForm,
                                        movie_id: e.target.value,
                                        show_date: movie?.release_date || ''
                                    });
                                }}
                                required
                                style={inputStyle}
                            >
                                <option value="">Chọn phim</option>
                                {movies.map(m => (
                                    <option key={m.id} value={m.id}>{m.title}</option>
                                ))}
                            </select>
                            <select
                                value={showtimeForm.theater_id}
                                onChange={(e) => setShowtimeForm({ ...showtimeForm, theater_id: e.target.value })}
                                required
                                style={inputStyle}
                            >
                                <option value="">Chọn phòng</option>
                                {theaters.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={formRow}>
                            <label style={adminFieldStyle}>
                                <span style={adminLabelStyle}>Tên phòng chiếu</span>
                                <input
                                    type="text"
                                    placeholder="Tên phòng chiếu"
                                    value={showtimeForm.room_name}
                                    onChange={(e) => setShowtimeForm({ ...showtimeForm, room_name: e.target.value })}
                                    required
                                    style={inputStyle}
                                />
                            </label>
                            <label style={adminFieldStyle}>
                                <span style={adminLabelStyle}>Ngày chiếu</span>
                                <input
                                    type="date"
                                    min={selectedShowtimeMovie?.release_date || ''}
                                    value={showtimeForm.show_date}
                                    onChange={(e) => setShowtimeForm({ ...showtimeForm, show_date: e.target.value })}
                                    required
                                    style={inputStyle}
                                />
                            </label>
                        </div>
                        <div style={formRow}>
                            <label style={adminFieldStyle}>
                                <span style={adminLabelStyle}>Giờ bắt đầu suất chiếu</span>
                                <input
                                    type="time"
                                    value={showtimeForm.start_time}
                                    onChange={(e) => setShowtimeForm({ ...showtimeForm, start_time: e.target.value })}
                                    required
                                    style={inputStyle}
                                />
                            </label>
                            <label style={adminFieldStyle}>
                                <span style={adminLabelStyle}>Giờ kết thúc dự kiến</span>
                                <input
                                    type="text"
                                    value={formatDateTimePreview(showtimeEndPreview)}
                                    readOnly
                                    placeholder="Tự tính theo thời lượng phim"
                                    style={{ ...inputStyle, color: '#bbb' }}
                                />
                            </label>
                        </div>
                        {selectedShowtimeMovie?.release_date && (
                            <p style={showtimeHintStyle}>
                                Phim khởi chiếu từ {formatDateOnly(selectedShowtimeMovie.release_date)}.
                                {selectedShowtimeMovie.duration ? ` Thời lượng ${selectedShowtimeMovie.duration} phút, hệ thống tự tính giờ kết thúc.` : ''}
                            </p>
                        )}
                        <div style={formRow}>
                            <input
                                type="number"
                                min="0"
                                placeholder="Giá vé"
                                value={showtimeForm.price}
                                onChange={(e) => setShowtimeForm({ ...showtimeForm, price: e.target.value })}
                                required
                                style={inputStyle}
                            />
                            <div />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <button type="submit" style={btnThêm}>
                                {editingShowtime ? 'Lưu suất chiếu' : 'Thêm suất chiếu'}
                            </button>
                            {editingShowtime && (
                                <button type="button" onClick={resetShowtimeForm} style={cancelBtn}>
                                    Hủy
                                </button>
                            )}
                        </div>
                    </form>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #444' }}>
                                <th>ID</th>
                                <th>Phim</th>
                                <th>Phòng</th>
                                <th>Ngày chiếu</th>
                                <th>Giờ bắt đầu</th>
                                <th>Giờ kết thúc</th>
                                <th>Giá</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {showtimes.map(s => (
                                <tr key={s.id} style={{ borderBottom: '1px solid #333' }}>
                                    <td>{s.id}</td>
                                    <td>{s.movie_title}</td>
                                    <td>{s.theater_name}</td>
                                    <td>{new Date(s.start_time).toLocaleDateString('vi-VN')}</td>
                                    <td>{new Date(s.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}</td>
                                    <td>{s.end_time ? new Date(s.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '-'}</td>
                                    <td>{s.price}</td>
                                    <td>
                                        <Edit onClick={() => handleEditShowtime(s)} style={{ cursor: 'pointer', marginRight: '15px' }} color="gold" />
                                        <Trash2 onClick={() => handleDeleteShowtime(s.id)} style={{ cursor: 'pointer' }} color="red" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'seats' && (
                <div>
                    <h2>Quản Lý Ghế</h2>
                    <div style={formStyle}>
                        <div style={formRow}>
                            <select
                                value={seatShowtimeId}
                                onChange={(e) => handleSelectSeatShowtime(e.target.value)}
                                style={inputStyle}
                            >
                                <option value="">Chọn suất chiếu</option>
                                {showtimes.map(s => (
                                    <option key={s.id} value={s.id}>{`${s.movie_title} | ${s.room_name || s.theater_name} | ${new Date(s.start_time).toLocaleString()}`}</option>
                                ))}
                            </select>
                        </div>
                        <div style={formRow}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#888' }}>Số lượng ghế muốn thêm:</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        placeholder="Nhập số ghế"
                                        value={seatsToAdd}
                                        onChange={(e) => setSeatsToAdd(e.target.value)}
                                        style={inputStyle}
                                    />
                                    <button type="button" onClick={handleGenerateSeats} style={btnThêm}>
                                        Thêm ghế
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#888' }}>Số lượng ghế muốn xóa:</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        placeholder="Nhập số ghế"
                                        value={seatsToDelete}
                                        onChange={(e) => setSeatsToDelete(e.target.value)}
                                        style={inputStyle}
                                    />
                                    <button type="button" onClick={handleDeleteSeats} style={{ ...btnThêm, background: '#d32f2f' }}>
                                        Xóa ghế
                                    </button>
                                </div>
                            </div>
                        </div>
                        {seatShowtimeId && (
                            <p>Đã chọn suất chiếu #{seatShowtimeId}. Số ghế hiện tại: {seats.length}</p>
                        )}
                    </div>
                    <div style={{ 
                        background: '#111',
                        borderRadius: '10px',
                        padding: '20px',
                        marginTop: '20px'
                    }}>
                        {/* Màn hình */}
                        <div style={{
                            width: '80%',
                            height: '40px',
                            background: '#333',
                            borderRadius: '20px',
                            margin: '0 auto 30px auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#666',
                            fontWeight: 'bold'
                        }}>
                            MÀN HÌNH
                        </div>
                        
                        {/* Ghế ngồi */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(() => {
                                // Nhóm ghế theo hàng
                                const seatsByRow = {};
                                seats.forEach(seat => {
                                    const row = seat.seat_number.charAt(0);
                                    if (!seatsByRow[row]) seatsByRow[row] = [];
                                    seatsByRow[row].push(seat);
                                });
                                
                                return Object.keys(seatsByRow).sort().map(row => (
                                    <div key={row} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ 
                                            width: '30px', 
                                            textAlign: 'center', 
                                            color: '#888', 
                                            fontWeight: 'bold' 
                                        }}>
                                            {row}
                                        </div>
                                        <div style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: `repeat(${seatsByRow[row].length}, 1fr)`, 
                                            gap: '5px',
                                            flex: 1
                                        }}>
                                            {seatsByRow[row].map(seat => (
                                                <div key={seat.id} style={{
                                                    padding: '8px 6px',
                                                    borderRadius: '4px',
                                                    background: seat.is_booked ? '#661818' : '#163d14',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                    textAlign: 'center',
                                                    fontSize: '11px',
                                                    minHeight: '35px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    border: '1px solid #333',
                                                    transition: 'all 0.2s ease'
                                                }} onClick={() => handleToggleSeat(seat)}>
                                                    <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                                                        {seat.seat_number.substring(1)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'bookings' && (
                <div>
                    <h2>Quản Lý Đặt Vé</h2>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #444' }}>
                                <th>ID</th>
                                <th>Người dùng</th>
                                <th>Phim</th>
                                <th>Phòng</th>
                                <th>Ghế</th>
                                <th>Suất chiếu</th>
                                <th>Hạn vé</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map(b => (
                                <tr key={b.id} style={{ borderBottom: '1px solid #333' }}>
                                    <td>{b.id}</td>
                                    <td>{b.username}</td>
                                    <td>{b.movie_title}</td>
                                    <td>{b.theater_name}</td>
                                    <td>{b.seat_number}</td>
                                    <td>{b.start_time ? new Date(b.start_time).toLocaleString('vi-VN') : 'N/A'}</td>
                                    <td>{b.end_time ? new Date(b.end_time).toLocaleString('vi-VN') : 'N/A'}</td>
                                    <td>{bookingStatusLabel(b.status)}</td>
                                    <td>
                                        {b.status === 'pending' && (
                                            <>
                                                <button onClick={() => handleConfirmBooking(b.id)} style={smallConfirmBtn}>Xác nhận</button>
                                                <button onClick={() => handleCancelBooking(b.id)} style={smallCancelBtn}>Hủy</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// CSS inline đơn giản
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#1a1a1a', padding: '10px' };
const btnThêm = { background: '#e50914', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' };
const tabStyle = (active) => ({
    background: active ? '#e50914' : '#333',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginRight: '10px'
});
const inputStyle = { width: '100%', padding: '12px', margin: '10px 0', background: '#111', color: 'white', border: '1px solid #444', borderRadius: '5px', boxSizing: 'border-box' };
const adminFieldStyle = { display: 'block', marginBottom: '10px' };
const adminLabelStyle = { display: 'block', marginBottom: '4px', color: '#ddd', fontSize: '13px', fontWeight: 600 };
const showtimeHintStyle = { color: '#aaa', fontSize: '13px', margin: '-2px 0 16px' };
const formStyle = { marginBottom: '20px', padding: '20px', background: '#111', borderRadius: '10px' };
const formRow = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
const cancelBtn = { background: '#444', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const smallConfirmBtn = { background: '#16a34a', color: 'white', padding: '6px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' };
const smallCancelBtn = { background: '#d32f2f', color: 'white', padding: '6px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' };

export default AdminDashboard;
