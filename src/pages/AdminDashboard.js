import React, { useCallback, useEffect, useState } from 'react';
import './AdminDashboard.css';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Plus } from 'lucide-react';
import { formatDateOnly } from '../utils/date';

const parseLocalDateTime = (value) => {
    if (!value) return null;

    const str = String(value).trim();
    
    // Xử lý định dạng MySQL: YYYY-MM-DD HH:mm:ss
    // hoặc ISO: YYYY-MM-DDTHH:mm:ss
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/);
    if (match) {
        const [, year, month, day, hour, minute, second] = match;
        return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
    }

    // Fallback cho định dạng khác
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
        return date;
    }

    return null;
};

const toTimeInputValue = (value) => {
    const date = parseLocalDateTime(value);
    if (!date) return '';

    const pad = (number) => String(number).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toDateInputFromDateTime = (value) => {
    const date = parseLocalDateTime(value);
    if (!date) return '';

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
    const date = parseLocalDateTime(dateTimeValue);
    if (!date || !minutes) return null;

    date.setMinutes(date.getMinutes() + Number(minutes));

    const pad = (number) => String(number).padStart(2, '0');
    return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate())
    ].join('-') + ` ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
};

const formatDateTimePreview = (dateTimeValue) => {
    const date = parseLocalDateTime(dateTimeValue);
    if (!date) return '';

    return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour12: false
    });
};

const formatLocalDate = (value) => {
    const date = parseLocalDateTime(value);
    return date ? date.toLocaleDateString('vi-VN') : 'N/A';
};

const formatLocalTime = (value) => {
    const date = parseLocalDateTime(value);
    return date ? date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
};

const formatLocalDateTime = (value) => {
    const date = parseLocalDateTime(value);
    return date ? date.toLocaleString('vi-VN') : 'N/A';
};

const formatCurrency = (value) => {
    const number = Number(value) || 0;
    return number.toLocaleString('vi-VN') + ' đ';
};

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('movies');
    const [movies, setMovies] = useState([]);
    const [theaters, setTheaters] = useState([]);
    const [showtimes, setShowtimes] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsFilter, setStatsFilter] = useState({ from_date: '', to_date: '' });
    const [chartType, setChartType] = useState('line');
    const [quickRange, setQuickRange] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [theaterForm, setTheaterForm] = useState({ name: '', capacity: '' });
    const [editingTheater, setEditingTheater] = useState(null);
    const [showtimeForm, setShowtimeForm] = useState({ movie_id: '', theater_id: '', room_name: '', show_date: '', start_time: '', price: '' });
    const [editingShowtime, setEditingShowtime] = useState(null);
    const [seatShowtimeId, setSeatShowtimeId] = useState('');
    const [seats, setSeats] = useState([]);
    const [bookingFilter, setBookingFilter] = useState('all');
    const [seatsToAdd, setSeatsToAdd] = useState('');
    const [seatsToDelete, setSeatsToDelete] = useState('');
    const [hoveredDot, setHoveredDot] = useState(null); // { idx, x, y, value, label }
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

    const formatDateInput = (date) => {
        if (!(date instanceof Date)) return '';
        return date.toISOString().slice(0, 10);
    };

    const getQuickRangeDates = (range) => {
        const now = new Date();
        const to = new Date(now);
        const from = new Date(now);

        if (range === 'day') {
            // chỉ ngày hiện tại
        } else if (range === 'week') {
            from.setDate(to.getDate() - 6);
        } else if (range === 'month') {
            from.setMonth(to.getMonth() - 1);
        }

        return {
            from_date: formatDateInput(from),
            to_date: formatDateInput(to)
        };
    };

    const fetchStatistics = useCallback(async (overrideFilter = null) => {
        try {
            setStatsLoading(true);
            const params = {};
            const filter = overrideFilter || statsFilter;
            if (filter.from_date) params.from_date = filter.from_date;
            if (filter.to_date) params.to_date = filter.to_date;
            const res = await api.get('/admin/statistics', { params });
            setStatistics(res.data);
        } catch (err) {
            console.error('Lỗi lấy thống kê:', err);
            setStatistics(null);
        } finally {
            setStatsLoading(false);
        }
    }, [statsFilter]);

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

    const applyQuickRange = (range) => {
        const nextFilter = getQuickRangeDates(range);
        setStatsFilter(nextFilter);
        setQuickRange(range);
        fetchStatistics(nextFilter);
    };

    const filterRevenueRows = (items = []) => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return items;

        return items.filter(item => {
            const title = String(item.movie_title || item.theater_name || '').toLowerCase();
            const count = String(item.tickets_sold || item.orders || '').toLowerCase();
            return title.includes(query) || count.includes(query);
        });
    };

    const selectedShowtimeMovie = movies.find(movie => String(movie.id) === String(showtimeForm.movie_id));
    const showtimeStartPreview = buildDateTimeValue(showtimeForm.show_date, showtimeForm.start_time);
    const statusOrder = ['pending', 'confirmed', 'expired', 'cancel'];
    const sortedBookings = [...bookings].sort((a, b) => {
        const timeA = a.start_time ? parseLocalDateTime(a.start_time)?.getTime() : 0;
        const timeB = b.start_time ? parseLocalDateTime(b.start_time)?.getTime() : 0;
        return timeB - timeA || (b.id - a.id);
    });
    const bookingsByStatus = statusOrder.reduce((acc, status) => {
        acc[status] = sortedBookings.filter(b => b.status === status);
        return acc;
    }, {});
    const filteredBookings = bookingFilter === 'all' ? sortedBookings : bookingsByStatus[bookingFilter] || [];
    const showtimeEndPreview = addMinutesToDateTimeValue(showtimeStartPreview, selectedShowtimeMovie?.duration);

    const revenueTimeline = statistics?.revenue_by_date || [];
    const filteredRevenueByMovie = filterRevenueRows(statistics?.revenue_by_movie || []);
    const filteredRevenueByShowtime = filterRevenueRows(statistics?.revenue_by_showtime || []);
    const filteredRevenueByTheater = filterRevenueRows(statistics?.revenue_by_theater || []);
    const totalTimelineRevenue = revenueTimeline.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
    const totalTimelineOrders = revenueTimeline.reduce((sum, item) => sum + Number(item.orders || 0), 0);
    const topShowtimeCharts = filteredRevenueByShowtime.slice().sort((a, b) => Number(b.revenue) - Number(a.revenue)).slice(0, 6);
    const topTheaterCharts = filteredRevenueByTheater.slice().sort((a, b) => Number(b.revenue) - Number(a.revenue)).slice(0, 6);
    const topMovieCharts = filteredRevenueByMovie.slice().sort((a, b) => Number(b.revenue) - Number(a.revenue)).slice(0, 6);
    const maxShowtimeRevenue = topShowtimeCharts.length ? Math.max(...topShowtimeCharts.map(item => Number(item.revenue) || 0)) : 1;

    const renderMiniRevenueChart = (items, labelKey, valueKey) => {
        if (!items.length) {
            return <div style={{ color: '#64748b', padding: '16px 0' }}>Không có dữ liệu biểu đồ.</div>;
        }

        const CHART_HEIGHT = 150; // px cố định cho vùng bar
        const maxValue = Math.max(...items.map(item => Number(item[valueKey] || 0)), 1);
        return (
            <div style={miniRevenueChartGrid}>
                {items.map((item, idx) => {
                    const val = Number(item[valueKey] || 0);
                    const barHeight = Math.max(6, (val / maxValue) * CHART_HEIGHT);
                    return (
                        <div key={idx} style={{ ...miniRevenueColumn, minHeight: 'unset' }}>
                            {/* value label trên thanh */}
                            <div style={miniRevenueValue}>{val.toLocaleString('vi-VN')} đ</div>
                            {/* vùng bar cố định chiều cao */}
                            <div style={{ height: `${CHART_HEIGHT}px`, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                                <div
                                    style={{
                                        ...miniRevenueBar,
                                        height: `${barHeight}px`,
                                        width: '100%'
                                    }}
                                />
                            </div>
                            <div style={miniRevenueLabel}>{String(item[labelKey] || item.movie_title || item.theater_name || 'N/A')}</div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderTimelineChart = () => {
        if (!revenueTimeline.length) {
            return <div style={{ color: '#64748b', padding: '20px 0' }}>Không có dữ liệu timeline để hiển thị.</div>;
        }

        const maxValue = Math.max(...revenueTimeline.map(item => Number(item.revenue || 0)), 1);
        const xCount = revenueTimeline.length;
        const formatChartDate = (dateStr) => {
            if (!dateStr) return '';
            // Parse ISO or MySQL date string
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
                return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
            }
            // fallback: take first 10 chars YYYY-MM-DD
            return String(dateStr).slice(0, 10);
        };
        const dots = revenueTimeline.map((item, index) => {
            const value = Number(item.revenue || 0);
            const x = xCount === 1 ? 50 : 5 + (index / (xCount - 1)) * 90;
            const y = 90 - (value / maxValue) * 70;
            return { x, y, value, label: formatChartDate(item.date) };
        });

        if (chartType === 'line') {
            const W = 1000, H = 280, PAD_L = 80, PAD_R = 30, PAD_T = 20, PAD_B = 50;
            const chartW = W - PAD_L - PAD_R;
            const chartH = H - PAD_T - PAD_B;

            // Tính X theo timestamp thực tế để khoảng cách ngày đúng
            const timestamps = revenueTimeline.map(item => new Date(item.date).getTime());
            const minTs = Math.min(...timestamps);
            const maxTs = Math.max(...timestamps);
            const tsRange = maxTs - minTs || 1;

            const scaledDots = revenueTimeline.map((item) => {
                const value = Number(item.revenue || 0);
                const ts = new Date(item.date).getTime();
                const x = PAD_L + (xCount === 1 ? chartW / 2 : ((ts - minTs) / tsRange) * chartW);
                const y = PAD_T + chartH - (value / maxValue) * chartH;
                return { x, y, value, label: formatChartDate(item.date) };
            });

            const linePath = scaledDots.map((p, i) => (i === 0 ? 'M' : 'L') + ' ' + p.x + ',' + p.y).join(' ');

            // Area fill dưới đường
            const areaPath = linePath + ' L ' + scaledDots[scaledDots.length-1].x + ',' + (PAD_T + chartH)
                + ' L ' + PAD_L + ',' + (PAD_T + chartH) + ' Z';

            // Y-axis: 5 mốc
            const gridLines = Array.from({ length: 5 }, (_, i) => {
                const frac = i / 4;
                const yPos = PAD_T + chartH * frac;
                const val = maxValue * (1 - frac);
                const label = val >= 1000000
                    ? (val / 1000000).toFixed(1) + 'M'
                    : val >= 1000
                        ? Math.round(val / 1000) + 'k'
                        : Math.round(val).toString();
                return { yPos, label };
            });

            return (
                <div style={{ ...timelineChartWrapper, padding: '8px 0 0 0' }}>
                    <svg viewBox={'0 0 ' + W + ' ' + H} style={{ width: '100%', display: 'block', overflow: 'visible' }}>
                        <defs>
                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0d6efd" stopOpacity="0.18" />
                                <stop offset="100%" stopColor="#0d6efd" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {/* Grid lines + Y labels */}
                        {gridLines.map((g, i) => (
                            <g key={i}>
                                <line x1={PAD_L} x2={W - PAD_R} y1={g.yPos} y2={g.yPos}
                                    stroke={i === 0 ? '#cbd5e1' : '#e2e8f0'} strokeWidth="1" strokeDasharray={i === 0 ? 'none' : '4 3'} />
                                <text x={PAD_L - 10} y={g.yPos + 5} textAnchor="end" fontSize="11" fill="#94a3b8">{g.label}</text>
                            </g>
                        ))}
                        {/* Baseline */}
                        <line x1={PAD_L} x2={W - PAD_R} y1={PAD_T + chartH} y2={PAD_T + chartH} stroke="#cbd5e1" strokeWidth="1.5" />
                        {/* Area */}
                        <path d={areaPath} fill="url(#areaGrad)" />
                        {/* Line */}
                        <path d={linePath} fill="none" stroke="#0d6efd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Dots + X label (no always-visible value) */}
                        {scaledDots.map((p, idx) => (
                            <g key={idx}
                                onMouseEnter={() => setHoveredDot({ idx, x: p.x, y: p.y, value: p.value, label: p.label })}
                                onMouseLeave={() => setHoveredDot(null)}
                                style={{ cursor: 'pointer' }}
                            >
                                {/* Vùng hit area rộng hơn để dễ hover */}
                                <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
                                <circle cx={p.x} cy={p.y} r={hoveredDot?.idx === idx ? 7 : 5}
                                    fill="#fff" stroke="#0d6efd"
                                    strokeWidth={hoveredDot?.idx === idx ? 3 : 2.5}
                                    style={{ transition: 'r 0.15s ease' }}
                                />
                                <text x={p.x} y={H - 10} textAnchor="middle" fontSize="11" fill="#64748b">{p.label}</text>
                            </g>
                        ))}
                        {/* Tooltip khi hover */}
                        {hoveredDot && (() => {
                            const TW = 130, TH = 44, TR = 6;
                            const tx = Math.min(Math.max(hoveredDot.x - TW / 2, PAD_L), W - PAD_R - TW);
                            const ty = hoveredDot.y - TH - 12;
                            const formattedVal = hoveredDot.value >= 1000000
                                ? (hoveredDot.value / 1000000).toFixed(2) + 'M đ'
                                : hoveredDot.value >= 1000
                                    ? Math.round(hoveredDot.value / 1000) + 'k đ'
                                    : hoveredDot.value.toLocaleString('vi-VN') + ' đ';
                            return (
                                <g pointerEvents="none">
                                    {/* Shadow */}
                                    <rect x={tx + 2} y={ty + 2} width={TW} height={TH} rx={TR} fill="rgba(0,0,0,0.12)" />
                                    {/* Box */}
                                    <rect x={tx} y={ty} width={TW} height={TH} rx={TR} fill="#1e293b" />
                                    {/* Arrow */}
                                    <polygon points={`${hoveredDot.x - 6},${ty + TH} ${hoveredDot.x + 6},${ty + TH} ${hoveredDot.x},${ty + TH + 8}`} fill="#1e293b" />
                                    {/* Date */}
                                    <text x={tx + TW / 2} y={ty + 16} textAnchor="middle" fontSize="11" fill="#94a3b8">{hoveredDot.label}</text>
                                    {/* Value */}
                                    <text x={tx + TW / 2} y={ty + 33} textAnchor="middle" fontSize="12" fontWeight="700" fill="#60a5fa">{formattedVal}</text>
                                </g>
                            );
                        })()}
                    </svg>
                </div>
            );
        }

        const BAR_HEIGHT = 200; // px
        return (
            <div style={{ ...timelineBarWrapper, minHeight: `${BAR_HEIGHT + 60}px`, alignItems: 'flex-end' }}>
                {dots.map((point, idx) => (
                    <div key={idx} style={timelineBarColumn}>
                        <div style={{ ...timelineBarFill, height: `${Math.max(6, (point.value / maxValue) * BAR_HEIGHT)}px` }} />
                        <div style={timelineBarAmount}>{Number(point.value).toLocaleString('vi-VN')} đ</div>
                        <div style={timelineBarLabel}>{point.label}</div>
                    </div>
                ))}
            </div>
        );
    };

    useEffect(() => {
        if (user?.role !== 'admin') {
            alert("Bạn không có quyền truy cập!");
            navigate('/');
            return;
        }
        fetchMovies();
        fetchTheaters();
        fetchShowtimes();
        fetchBookings();
        if (activeTab === 'statistics') {
            fetchStatistics();
        }
    }, [user?.role, navigate, activeTab, fetchStatistics]);

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
            expired: 'Đã hết hạn',
            cancel: 'Đã hủy'
        };
        return labels[status] || status;
    };

    return (
        <div className="admin-dashboard" style={{ padding: '30px', color: '#111', background: '#f7f9fc', minHeight: '100vh' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                <button className="tab-btn" onClick={() => setActiveTab('movies')} style={tabStyle(activeTab === 'movies')}>Quản Lý Phim</button>
                <button className="tab-btn" onClick={() => setActiveTab('theaters')} style={tabStyle(activeTab === 'theaters')}>Quản Lý Phòng Chiếu</button>
                <button className="tab-btn" onClick={() => setActiveTab('showtimes')} style={tabStyle(activeTab === 'showtimes')}>Quản Lý Suất Chiếu</button>
                <button className="tab-btn" onClick={() => setActiveTab('seats')} style={tabStyle(activeTab === 'seats')}>Quản Lý Ghế</button>
                <button className="tab-btn" onClick={() => setActiveTab('bookings')} style={tabStyle(activeTab === 'bookings')}>Quản Lý Đặt Vé</button>
                <button className="tab-btn" onClick={() => setActiveTab('statistics')} style={tabStyle(activeTab === 'statistics')}>Thống Kê</button>
            </div>

            {activeTab === 'movies' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h2>Quản Lý Phim</h2>
                        <button onClick={() => navigate('/admin/add')} className="btn-primary" style={btnThêm}>
                            <Plus size={18} /> Thêm Phim Mới
                        </button>
                    </div>
                    <div className="table-wrap">
                        <table style={tableStyle}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <th>ID</th>
                                <th>Poster</th>
                                <th>Tên phim</th>
                                <th>Thể loại</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movies.map(m => (
                                <tr key={m.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                                    <td>{m.id}</td>
                                    <td><img src={m.poster_url?.startsWith('http') ? m.poster_url : `${import.meta.env.VITE_API_BASE_URL}${m.poster_url}`} width="50" alt="" /></td>
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
                </div>
            )}

            {activeTab === 'theaters' && (
                <div>
                    <h2>Quản Lý Phòng Chiếu</h2>
                    <form onSubmit={handleSubmitTheater} className="admin-form" style={formStyle}>
                        <div className="grid-2" style={formRow}>
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
                            <button type="submit" className="btn-primary" style={btnThêm}>
                                {editingTheater ? 'Lưu phòng chiếu' : 'Thêm phòng chiếu'}
                            </button>
                            {editingTheater && (
                                <button type="button" onClick={resetTheaterForm} style={cancelBtn}>
                                    Hủy
                                </button>
                            )}
                        </div>
                    </form>
                    <div className="table-wrap">
                        <table style={tableStyle}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <th>ID</th>
                                <th>Tên Phòng</th>
                                <th>Sức chứa</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {theaters.map(t => (
                                <tr key={t.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
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
                </div>
            )}

            {activeTab === 'showtimes' && (
                <div>
                    <h2>Quản Lý Suất Chiếu</h2>
                    <form onSubmit={handleSubmitShowtime} className="admin-form" style={formStyle}>
                        <div className="grid-2" style={formRow}>
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
                        <div className="grid-2" style={formRow}>
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
                        <div className="grid-2" style={formRow}>
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
                        <div className="grid-2" style={formRow}>
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
                    <div className="table-wrap">
                        <table style={tableStyle}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
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
                                <tr key={s.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                                    <td>{s.id}</td>
                                    <td>{s.movie_title}</td>
                                    <td>{s.theater_name}</td>
                                    <td>{formatLocalDate(s.start_time)}</td>
                                    <td>{formatLocalTime(s.start_time)}</td>
                                    <td>{s.end_time ? formatLocalTime(s.end_time) : '-'}</td>
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
                </div>
            )}

            {activeTab === 'seats' && (
                <div>
                    <h2>Quản Lý Ghế</h2>
                    <div className="admin-form" style={formStyle}>
                        <div className="grid-2" style={formRow}>
                            <select
                                value={seatShowtimeId}
                                onChange={(e) => handleSelectSeatShowtime(e.target.value)}
                                style={inputStyle}
                            >
                                <option value="">Chọn suất chiếu</option>
                                {showtimes.map(s => (
                                    <option key={s.id} value={s.id}>{`${s.movie_title} | ${s.room_name || s.theater_name} | ${formatLocalDateTime(s.start_time)}`}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid-2" style={formRow}>
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
                                    <button type="button" onClick={handleGenerateSeats} className="btn-primary" style={btnThêm}>
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
                                    <button type="button" onClick={handleDeleteSeats} className="btn-primary danger" style={{ ...btnThêm, background: '#d32f2f' }}>
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
                        background: '#ffffff',
                        borderRadius: '12px',
                        padding: '20px',
                        marginTop: '20px',
                        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)'
                    }}>
                        {/* Màn hình */}
                        <div style={{
                            width: '80%',
                            height: '40px',
                            background: '#e2e8f0',
                            borderRadius: '20px',
                            margin: '0 auto 30px auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0f172a',
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
                                                <div key={seat.id} className="seat-item" style={{
                                                    padding: '8px 6px',
                                                    borderRadius: '4px',
                                                    background: seat.is_booked ? '#bfdbfe' : '#dbeafe',
                                                    color: '#0f172a',
                                                    cursor: 'pointer',
                                                    textAlign: 'center',
                                                    fontSize: '11px',
                                                    minHeight: '35px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    border: '1px solid #cbd5e1',
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
                    <div style={bookingFilterRow}>
                        {['all', 'pending', 'confirmed', 'expired', 'cancel'].map(status => (
                            <button
                                key={status}
                                onClick={() => setBookingFilter(status)}
                                style={{
                                    ...bookingFilterChip,
                                    ...(bookingFilter === status ? bookingFilterChipActive : {})
                                }}
                            >
                                {status === 'all' ? 'Tất cả' : bookingStatusLabel(status)} ({status === 'all' ? bookings.length : bookingsByStatus[status]?.length || 0})
                            </button>
                        ))}
                    </div>
                    <div className="table-wrap">
                        <table style={tableStyle}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
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
                            {bookingFilter === 'all' ? (
                                statusOrder.map(status => (
                                    <React.Fragment key={status}>
                                        <tr style={{ background: '#f8fafc', color: '#0f172a' }}>
                                            <td colSpan={9} style={{ padding: '14px 10px', fontWeight: 700, borderBottom: '1px solid #cbd5e1' }}>
                                                {bookingStatusLabel(status)} ({bookingsByStatus[status]?.length || 0})
                                            </td>
                                        </tr>
                                        {bookingsByStatus[status]?.length === 0 ? (
                                            <tr key={`${status}-empty`} style={{ borderBottom: '1px solid #cbd5e1' }}>
                                                <td colSpan={9} style={{ padding: '14px 10px', color: '#64748b' }}>
                                                    Không có vé {bookingStatusLabel(status).toLowerCase()}.
                                                </td>
                                            </tr>
                                        ) : bookingsByStatus[status].map(b => (
                                            <tr key={b.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                                                <td>{b.id}</td>
                                                <td>{b.username}</td>
                                                <td>{b.movie_title}</td>
                                                <td>{b.theater_name}</td>
                                                <td>{b.seat_number}</td>
                                                <td>{formatLocalDateTime(b.start_time)}</td>
                                                <td>{formatLocalDateTime(b.end_time)}</td>
                                                <td>{bookingStatusLabel(b.status)}</td>
                                                <td>
                                                            {b.status === 'pending' && (
                                                        <>
                                                            <button className="small-confirm" onClick={() => handleConfirmBooking(b.id)} style={smallConfirmBtn}>Xác nhận</button>
                                                            <button className="small-cancel" onClick={() => handleCancelBooking(b.id)} style={smallCancelBtn}>Hủy</button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))
                            ) : filteredBookings.length === 0 ? (
                                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                                    <td colSpan={9} style={{ padding: '14px 10px', color: '#64748b' }}>
                                        Không có vé phù hợp với bộ lọc.
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map(b => (
                                    <tr key={b.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                                        <td>{b.id}</td>
                                        <td>{b.username}</td>
                                        <td>{b.movie_title}</td>
                                        <td>{b.theater_name}</td>
                                        <td>{b.seat_number}</td>
                                        <td>{formatLocalDateTime(b.start_time)}</td>
                                        <td>{formatLocalDateTime(b.end_time)}</td>
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
                                ))
                            )}
                        </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'statistics' && (
                <div>
                    <h2>Thống Kê Doanh Thu</h2>
                    {/* Hàng 1: Các input filter */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '20px', alignItems: 'flex-end' }}>
                        <div style={{ ...statCard, flex: '1 1 150px', minWidth: '140px', maxWidth: '220px' }}>
                            <div style={statLabel}>Từ ngày</div>
                            <input
                                type="date"
                                value={statsFilter.from_date}
                                onChange={e => setStatsFilter(prev => ({ ...prev, from_date: e.target.value }))}
                                style={filterInput}
                            />
                        </div>
                        <div style={{ ...statCard, flex: '1 1 150px', minWidth: '140px', maxWidth: '220px' }}>
                            <div style={statLabel}>Đến ngày</div>
                            <input
                                type="date"
                                value={statsFilter.to_date}
                                onChange={e => setStatsFilter(prev => ({ ...prev, to_date: e.target.value }))}
                                style={filterInput}
                            />
                        </div>
                        <div style={{ ...statCard, flex: '1 1 150px', minWidth: '140px', maxWidth: '200px' }}>
                            <div style={statLabel}>Dạng biểu đồ</div>
                            <select value={chartType} onChange={e => setChartType(e.target.value)} style={filterInput}>
                                <option value="line">Dạng đường kẻ</option>
                                <option value="bar">Dạng cột</option>
                            </select>
                        </div>
                        <div style={{ ...statCard, flex: '2 1 180px', minWidth: '180px' }}>
                            <div style={statLabel}>Tìm phim / số vé</div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Nhập tên phim hoặc số vé"
                                style={filterInput}
                            />
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                            <button onClick={() => applyQuickRange('day')} style={quickFilterBtn(quickRange === 'day')}>Trong ngày</button>
                            <button onClick={() => applyQuickRange('week')} style={quickFilterBtn(quickRange === 'week')}>Tuần</button>
                            <button onClick={() => applyQuickRange('month')} style={quickFilterBtn(quickRange === 'month')}>Tháng</button>
                            <button onClick={() => fetchStatistics()} style={buttonPrimary}>Làm mới</button>
                        </div>
                    </div>

                    {statsLoading && <p>Đang tải thống kê...</p>}

                    {!statsLoading && statistics && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '24px' }}>
                                <div style={metricCard}>
                                    <div style={metricTitle}>Tổng doanh thu</div>
                                    <div style={metricValue}>{statistics.total_revenue?.toLocaleString('vi-VN')} đ</div>
                                </div>
                                <div style={metricCard}>
                                    <div style={metricTitle}>Số đơn hàng</div>
                                    <div style={metricValue}>{statistics.tickets_sold}</div>
                                </div>
                                <div style={metricCard}>
                                    <div style={metricTitle}>Doanh thu chờ xử lý</div>
                                    <div style={metricValue}>{statistics.pending_revenue?.toLocaleString('vi-VN')} đ</div>
                                </div>
                                <div style={metricCard}>
                                    <div style={metricTitle}>Doanh thu đã hủy</div>
                                    <div style={metricValue}>{statistics.canceled_revenue?.toLocaleString('vi-VN')} đ</div>
                                </div>
                                <div style={metricCard}>
                                    <div style={metricTitle}>Doanh thu vé hết hạn</div>
                                    <div style={metricValue}>{statistics.expired_revenue?.toLocaleString('vi-VN')} đ</div>
                                </div>
                                <div style={metricCard}>
                                    <div style={metricTitle}>Giá vé TB</div>
                                    <div style={metricValue}>{statistics.average_ticket_value?.toLocaleString('vi-VN')} đ</div>
                                </div>
                            </div>

                            <section style={{ marginTop: '28px' }}>
                                <h3>Biểu đồ doanh thu theo mốc thời gian</h3>
                                <div style={chartIntroRow}>
                                    <span style={chartSummary}>Tổng doanh thu: <strong>{totalTimelineRevenue.toLocaleString('vi-VN')} đ</strong></span>
                                    <span style={chartSummary}>Tổng đơn hàng: <strong>{totalTimelineOrders}</strong></span>
                                </div>
                                <div style={timelineChartCard}>
                                    {renderTimelineChart()}
                                </div>
                            </section>

                            <section style={{ marginTop: '28px' }}>
                                <h3>Biểu đồ doanh thu suất chiếu hàng đầu</h3>
                                <div style={miniChartSection}>
                                    {renderMiniRevenueChart(topShowtimeCharts, 'movie_title', 'revenue')}
                                </div>
                                <div style={chartSection}>
                                    {topShowtimeCharts.length === 0 && (
                                        <div style={{ color: '#aaa' }}>Không có dữ liệu để hiển thị biểu đồ.</div>
                                    )}
                                    {topShowtimeCharts.map(item => (
                                        <div key={item.showtime_id} style={chartRow}>
                                            <div style={chartLabel}>
                                                <div>{item.movie_title}</div>
                                                <div style={chartSmallLabel}>{formatLocalDateTime(item.start_time)}</div>
                                            </div>
                                            <div style={chartBarBackground}>
                                                <div
                                                    style={{
                                                        ...chartBar,
                                                        width: `${(Number(item.revenue) / maxShowtimeRevenue) * 100}%`
                                                    }}
                                                />
                                            </div>
                                            <div style={chartValue}>{formatCurrency(item.revenue)}</div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section style={{ marginTop: '28px' }}>
                                <h3>Doanh thu theo suất chiếu</h3>
                                <div style={miniChartSection}>
                                    {renderMiniRevenueChart(topShowtimeCharts, 'movie_title', 'revenue')}
                                </div>
                                <div className="table-wrap">
                                    <table style={tableStyle}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                <th>Suất chiếu</th>
                                                <th>Phim</th>
                                                <th>Phòng</th>
                                                <th>Rạp</th>
                                                <th>Thời gian</th>
                                                <th>Số vé</th>
                                                <th>Doanh thu</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredRevenueByShowtime.map(item => (
                                                <tr key={item.showtime_id} style={tableRow}>
                                                    <td style={tableCell}>{item.showtime_id}</td>
                                                    <td style={tableCell}>{item.movie_title}</td>
                                                    <td style={tableCell}>{item.room_name || 'N/A'}</td>
                                                    <td style={tableCell}>{item.theater_name}</td>
                                                    <td style={tableCell}>{formatLocalDateTime(item.start_time)}</td>
                                                    <td style={tableCell}>{item.tickets_sold}</td>
                                                    <td style={tableCell}>{Number(item.revenue).toLocaleString('vi-VN')} đ</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section style={{ marginTop: '24px' }}>
                                <h3>Biểu đồ doanh thu theo phòng chiếu</h3>
                                <div style={miniChartSection}>
                                    {renderMiniRevenueChart(topTheaterCharts, 'theater_name', 'revenue')}
                                </div>
                                <div className="table-wrap">
                                    <table style={tableStyle}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                <th>Rạp</th>
                                                <th>Doanh thu</th>
                                                <th>Số vé</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {statistics.revenue_by_theater.map(item => (
                                                <tr key={item.theater_id} style={tableRow}>
                                                    <td style={tableCell}>{item.theater_name}</td>
                                                    <td style={tableCell}>{Number(item.revenue).toLocaleString('vi-VN')} đ</td>
                                                    <td style={tableCell}>{item.tickets_sold}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section style={{ marginTop: '24px' }}>
                                <h3>Biểu đồ doanh thu theo phim</h3>
                                <div style={miniChartSection}>
                                    {renderMiniRevenueChart(topMovieCharts, 'movie_title', 'revenue')}
                                </div>
                                <div className="table-wrap">
                                    <table style={tableStyle}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                <th>Phim</th>
                                                <th>Doanh thu</th>
                                                <th>Số vé</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredRevenueByMovie.map(item => (
                                                <tr key={item.movie_id} style={tableRow}>
                                                    <td style={tableCell}>{item.movie_title}</td>
                                                    <td style={tableCell}>{Number(item.revenue).toLocaleString('vi-VN')} đ</td>
                                                    <td style={tableCell}>{item.tickets_sold}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

// CSS inline đơn giản
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#ffffff', padding: '10px', border: '1px solid #e2e8f0' };
const btnThêm = { background: '#0d6efd', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 6px 16px rgba(13, 110, 253, 0.15)' };
const tabStyle = (active) => ({
    background: active ? '#0d6efd' : '#eff6ff',
    color: active ? 'white' : '#0d3b91',
    padding: '10px 20px',
    border: '1px solid #cfe2ff',
    borderRadius: '8px',
    cursor: 'pointer',
    marginRight: '10px'
});
const inputStyle = { width: '100%', padding: '12px', margin: '10px 0', background: '#ffffff', color: '#111', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box' };
const statCard = { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', minWidth: '220px', width: '100%', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)' };
const statLabel = { color: '#475569', marginBottom: '8px', fontSize: '13px' };
const filterInput = { width: '100%', padding: '10px', background: '#ffffff', color: '#111', border: '1px solid #cbd5e1', borderRadius: '8px' };
const buttonPrimary = { background: '#0d6efd', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', boxShadow: '0 6px 16px rgba(13, 110, 253, 0.15)' };
const metricCard = { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', minHeight: '110px', boxShadow: '0 6px 18px rgba(15, 23, 42, 0.04)' };
const metricTitle = { color: '#475569', marginBottom: '12px', fontSize: '14px' };
const metricValue = { color: '#0d6efd', fontSize: '24px', fontWeight: '700' };
const chartSection = { display: 'grid', gap: '14px', marginTop: '18px' };
const chartRow = { display: 'grid', gridTemplateColumns: 'minmax(220px, 1.5fr) 2.5fr auto', gap: '12px', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #e2e8f0' };
const chartLabel = { display: 'flex', flexDirection: 'column', gap: '4px', color: '#102a43' };
const chartSmallLabel = { color: '#64748b', fontSize: '12px' };
const chartBarBackground = { background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '999px', height: '16px', width: '100%', overflow: 'hidden' };
const chartBar = { height: '100%', borderRadius: '999px', background: '#0d6efd' };
const chartValue = { color: '#102a43', fontSize: '13px', textAlign: 'right' };
const chartIntroRow = { display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '16px', color: '#334155' };
const chartSummary = { display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '999px', padding: '10px 14px', color: '#0f172a' };
const timelineChartCard = { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px', boxShadow: '0 6px 18px rgba(15, 23, 42, 0.05)' };
const timelineChartWrapper = { width: '100%', minHeight: '240px', position: 'relative', boxSizing: 'border-box', padding: '0 8px' };
const timelineBarWrapper = { display: 'flex', flexWrap: 'wrap', gap: '18px', alignItems: 'flex-end', minHeight: '260px' };
const timelineBarColumn = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' };
const timelineBarFill = { width: '48px', minHeight: '6px', background: '#0d6efd', borderRadius: '12px 12px 0 0' };
const timelineBarAmount = { color: '#102a43', fontSize: '12px', textAlign: 'center' };
const timelineBarLabel = { color: '#475569', fontSize: '12px', textAlign: 'center' };
const miniChartSection = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px', marginBottom: '16px' };
const miniRevenueChartGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', alignItems: 'end' };
const miniRevenueColumn = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' };
const miniRevenueBar = { width: '100%', background: '#0d6efd', borderRadius: '12px 12px 0 0', transition: 'height 0.25s ease' };
const miniRevenueValue = { fontSize: '12px', color: '#0f172a', textAlign: 'center' };
const miniRevenueLabel = { fontSize: '12px', color: '#475569', textAlign: 'center', lineHeight: '1.3' };
const quickFilterBtn = (active) => ({
    background: active ? '#0d6efd' : '#f8fafc',
    color: active ? 'white' : '#0d3b91',
    border: active ? '1px solid #0d6efd' : '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '10px 16px',
    cursor: 'pointer',
    minWidth: '110px'
});
const tableRow = { borderBottom: '1px solid #e2e8f0' };
const tableCell = { padding: '12px 10px', color: '#102a43' };
const bookingFilterRow = { display: 'flex', flexWrap: 'wrap', gap: '10px', margin: '18px 0' };
const bookingFilterChip = { border: '1px solid #cbd5e1', background: '#eff6ff', color: '#0d3b91', padding: '10px 16px', borderRadius: '999px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s ease' };
const bookingFilterChipActive = { background: '#0d6efd', color: '#fff', borderColor: '#0d6efd' };
const adminFieldStyle = { display: 'block', marginBottom: '10px' };
const adminLabelStyle = { display: 'block', marginBottom: '4px', color: '#334155', fontSize: '13px', fontWeight: 600 };
const showtimeHintStyle = { color: '#64748b', fontSize: '13px', margin: '-2px 0 16px' };
const formStyle = { marginBottom: '20px', padding: '20px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)' };
const formRow = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
const cancelBtn = { background: '#64748b', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const smallConfirmBtn = { background: '#16a34a', color: 'white', padding: '6px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' };
const smallCancelBtn = { background: '#d32f2f', color: 'white', padding: '6px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' };

export default AdminDashboard;