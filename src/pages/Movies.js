import React, { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showtimesByMovie, setShowtimesByMovie] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'admin';

  const dates = useMemo(() => {
    const range = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      range.push(date);
    }
    return range;
  }, []);

  useEffect(() => {
    api.get('/movies')
      .then(res => setMovies(res.data))
      .catch(err => console.error('Lỗi fetch movies:', err));
  }, []);

  useEffect(() => {
    if (movies.length === 0) return;
    setLoading(true);
    const fetchAllShowtimes = async () => {
      const showtimesData = {};
      try {
        await Promise.all(movies.map(async (movie) => {
          const res = await api.get(`/movies/${movie.id}/showtimes`);
          const filtered = res.data.filter(st => {
            const stDate = new Date(st.start_time);
            return stDate.toDateString() === selectedDate.toDateString();
          });
          if (filtered.length > 0) showtimesData[movie.id] = filtered;
        }));
        setShowtimesByMovie(showtimesData);
      } catch (err) {
        console.error("Lỗi khi tải lịch chiếu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllShowtimes();
  }, [selectedDate, movies]);

  const formatDate = (date) => date.toLocaleDateString('vi-VN', { month: '2-digit', day: '2-digit' });
  const formatDay = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  const handlePrevDate = () => {
    const idx = dates.findIndex(d => d.toDateString() === selectedDate.toDateString());
    if (idx > 0) setSelectedDate(dates[idx - 1]);
  };

  const handleNextDate = () => {
    const idx = dates.findIndex(d => d.toDateString() === selectedDate.toDateString());
    if (idx < dates.length - 1) setSelectedDate(dates[idx + 1]);
  };

  const moviesWithShowtimes = movies.filter(movie => showtimesByMovie[movie.id]);
  const isFirst = selectedDate.toDateString() === dates[0].toDateString();
  const isLast = selectedDate.toDateString() === dates[dates.length - 1].toDateString();

  return (
    <div style={styles.container}>

      {/* Date Picker */}
      <div style={styles.datePickerContainer}>
        <button onClick={handlePrevDate} disabled={isFirst}
          style={{ ...styles.dateNavBtn, opacity: isFirst ? 0.4 : 1 }}>
          <ChevronLeft size={18} />
        </button>

        <div style={styles.dateRange}>
          {dates.map((date, idx) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            return (
              <div key={idx} onClick={() => setSelectedDate(date)}
                style={{
                  ...styles.dateItem,
                  backgroundColor: isSelected ? '#e50914' : '#fff',
                  color: isSelected ? '#fff' : '#333',
                  border: isSelected ? '2px solid #e50914' : '2px solid #eee',
                  boxShadow: isSelected ? '0 2px 8px rgba(229,9,20,0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                <span style={{ fontSize: '11px', opacity: isSelected ? 0.85 : 0.5 }}>{formatDay(date)}</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{formatDate(date)}</span>
              </div>
            );
          })}
        </div>

        <button onClick={handleNextDate} disabled={isLast}
          style={{ ...styles.dateNavBtn, opacity: isLast ? 0.4 : 1 }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Section Header — matches Home */}
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Phim chiếu ngày {formatDate(selectedDate)}</h2>
        {isAdmin && (
          <button onClick={() => navigate('/admin/add')} style={styles.addBtn}>
            <Plus size={16} /> Thêm phim mới
          </button>
        )}
      </div>

      {/* Movie List */}
      {loading ? (
        <p style={styles.statusText}>Đang tải lịch chiếu...</p>
      ) : moviesWithShowtimes.length === 0 ? (
        <p style={styles.statusText}>Không có suất chiếu nào cho ngày này.</p>
      ) : (
        <div style={styles.movieList}>
          {moviesWithShowtimes.map(movie => (
            <MovieRow
              key={movie.id}
              movie={movie}
              showtimes={showtimesByMovie[movie.id]}
              onSelect={(stId) => navigate(`/select-seat/${stId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MovieRow = ({ movie, showtimes, onSelect }) => {
  const grouped = showtimes.reduce((acc, st) => {
    const key = st.theater_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(st);
    return acc;
  }, {});

  return (
    <div style={styles.movieCard}>
      <img
        src={`http://localhost:5000${movie.poster_url}`}
        alt={movie.title}
        style={styles.poster}
      />
      <div style={styles.movieInfo}>
        <h3 style={styles.movieTitle}>{movie.title}</h3>
        {Object.entries(grouped).map(([theater, sts]) => (
          <div key={theater} style={styles.theaterGroup}>
            <p style={styles.theaterName}>{theater}</p>
            <div style={styles.showtimeRow}>
              {sts.map(st => (
                <ShowtimeBtn key={st.id} st={st} onSelect={onSelect} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ShowtimeBtn = ({ st, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => onSelect(st.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.showtimeBtn,
        backgroundColor: hovered ? '#e50914' : '#fff',
        color: hovered ? '#fff' : '#333',
        borderColor: hovered ? '#e50914' : '#ddd',
      }}
    >
      {new Date(st.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}
      {st.room_name && <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: '4px' }}>· {st.room_name}</span>}
    </button>
  );
};

const styles = {
  container: {
    padding: '40px 5%',
    backgroundColor: '#fafafa',
    minHeight: '100vh',
    color: '#333',
  },

  // Date picker — light card style
  datePickerContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '40px',
    padding: '16px 20px',
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflowX: 'auto',
  },

  dateNavBtn: {
    background: '#e50914',
    color: 'white',
    border: 'none',
    width: '36px',
    height: '36px',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'opacity 0.2s',
  },

  dateRange: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    flex: 1,
    paddingBottom: '2px',
  },

  dateItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    minWidth: '64px',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },

  // Section header — matches Home exactly
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '3px solid #333',
    paddingBottom: '15px',
    marginBottom: '30px',
  },

  sectionTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },

  addBtn: {
    backgroundColor: '#e50914',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
  },

  statusText: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999',
    fontSize: '16px',
  },

  movieList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  // Movie card — matches Home movieCard style
  movieCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: '20px',
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
  },

  poster: {
    width: '120px',
    height: '175px',
    objectFit: 'cover',
    borderRadius: '6px',
    flexShrink: 0,
  },

  movieInfo: {
    flex: 1,
  },

  movieTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 16px 0',
  },

  theaterGroup: {
    marginBottom: '12px',
  },

  theaterName: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#e50914',
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  showtimeRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },

  showtimeBtn: {
    backgroundColor: '#fff',
    color: '#333',
    border: '1.5px solid #ddd',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
  },
};

export default Movies;