import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { formatDateOnly, parseDateOnly } from '../utils/date';

const toLocalDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const isSameDate = (value, date) => {
  const localDate = toLocalDate(value);
  return Boolean(localDate) && localDate.getTime() === date.getTime();
};

const Home = () => {
  const [moviesNowShowing, setMoviesNowShowing] = useState([]);
  const [moviesUpcoming, setMoviesUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);

      const moviesRes = await api.get('/movies');
      const movies = moviesRes.data || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const moviesWithShowtimes = await Promise.all(
        movies.map(async (movie) => {
          try {
            const showtimesRes = await api.get(`/movies/${movie.id}/showtimes`);
            const showtimes = showtimesRes.data || [];
            const showtimesToday = showtimes.filter((showtime) =>
              isSameDate(showtime.start_time, today)
            );

            return { ...movie, showtimes, showtimesToday };
          } catch (err) {
            console.error(`Loi tai suat chieu phim ${movie.id}:`, err);
            return { ...movie, showtimes: [], showtimesToday: [] };
          }
        })
      );

      const nowShowing = moviesWithShowtimes.filter(
        (movie) => movie.showtimesToday.length > 0
      );

      const nowShowingIds = new Set(nowShowing.map((movie) => movie.id));
      const upcoming = moviesWithShowtimes.filter((movie) => {
        if (nowShowingIds.has(movie.id)) return false;

        const releaseDate = parseDateOnly(movie.release_date);
        if (releaseDate && releaseDate > today) return true;

        return movie.showtimes.some((showtime) => {
          const showtimeDate = toLocalDate(showtime.start_time);
          return showtimeDate && showtimeDate > today;
        });
      });

      setMoviesNowShowing(nowShowing.slice(0, 8));
      setMoviesUpcoming(upcoming.slice(0, 8));
    } catch (err) {
      console.error('Loi fetch phim:', err);
      alert('Lỗi tải phim, vui lòng F5 để tải lại');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  return (
    <div style={styles.container}>
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Phim Đang Chiếu Hôm Nay</h2>
        </div>

        {loading ? (
          <div style={styles.loadingContainer}>
            <p style={styles.loadingText}>Đang tải phim...</p>
          </div>
        ) : moviesNowShowing.length > 0 ? (
          <div style={styles.moviesGrid}>
            {moviesNowShowing.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onBooking={handleBooking} />
            ))}
          </div>
        ) : (
          <div style={styles.emptyContainer}>
            <p style={styles.emptyText}>Hôm nay chưa có phim nào có suất chiếu</p>
          </div>
        )}
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Phim Sắp Chiếu</h2>
        </div>

        {loading ? (
          <div style={styles.loadingContainer}>
            <p style={styles.loadingText}>Đang tải phim...</p>
          </div>
        ) : moviesUpcoming.length > 0 ? (
          <div style={styles.moviesGrid}>
            {moviesUpcoming.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onBooking={handleBooking}
                isUpcoming
              />
            ))}
          </div>
        ) : (
          <div style={styles.emptyContainer}>
            <p style={styles.emptyText}>Hiện không có phim sắp chiếu</p>
          </div>
        )}
      </section>

      <div style={styles.viewAllContainer}>
        <button
          onClick={() => navigate('/movies')}
          style={styles.viewAllButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#d63838';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#e50914';
          }}
        >
          Xem tất cả phim
        </button>
      </div>
    </div>
  );
};

const MovieCard = ({ movie, onBooking, isUpcoming }) => {
  const [imageError, setImageError] = useState(false);
  const todayTimes = (movie.showtimesToday || [])
    .map((showtime) =>
      new Date(showtime.start_time).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    )
    .join(', ');

  return (
    <div style={styles.movieCard}>
      {isUpcoming && <div style={styles.badge}>PHIM SẮP CHIẾU</div>}

      <div style={styles.posterContainer}>
        <img
          src={
            imageError
              ? 'https://via.placeholder.com/200x300?text=No+Image'
              : `http://localhost:5000${movie.poster_url}`
          }
          alt={movie.title}
          style={styles.poster}
          onError={() => setImageError(true)}
        />
      </div>

      <div style={styles.movieInfo}>
        <h3 style={styles.movieTitle}>{movie.title}</h3>

        {movie.genre && <p style={styles.movieGenre}>Thể loại: {movie.genre}</p>}
        {movie.duration && <p style={styles.movieDuration}>Thời lượng: {movie.duration} phút</p>}

        <p style={styles.movieReleaseDate}>
          Khởi chiếu: <strong>{formatDateOnly(movie.release_date)}</strong>
        </p>

        {!isUpcoming && todayTimes && (
          <p style={styles.showtimeText}>Suất hôm nay: {todayTimes}</p>
        )}
      </div>

      <button
        onClick={() => onBooking(movie.id)}
        style={styles.buyButton}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#d63838';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#e50914';
        }}
      >
        {isUpcoming ? 'XEM CHI TIẾT' : 'MUA VÉ'}
      </button>
    </div>
  );
};

const styles = {
  container: {
    padding: '40px 5%',
    backgroundColor: '#fafafa',
    minHeight: '100vh',
    color: '#333'
  },

  section: {
    marginBottom: '60px'
  },

  sectionHeader: {
    borderBottom: '3px solid #333',
    paddingBottom: '15px',
    marginBottom: '40px'
  },

  sectionTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0
  },

  moviesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '30px',
    justifyContent: 'start'
  },

  movieCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: 'box-shadow 0.3s ease, transform 0.3s ease',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative'
  },

  badge: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    backgroundColor: '#fbbf24',
    color: '#000',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    zIndex: 10
  },

  posterContainer: {
    width: '100%',
    height: '280px',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0'
  },

  poster: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },

  movieInfo: {
    padding: '16px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },

  movieTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 12px 0',
    lineHeight: '1.3',
    minHeight: '40px'
  },

  movieGenre: {
    fontSize: '12px',
    color: '#666',
    margin: '4px 0',
    display: '-webkit-box',
    WebkitLineClamp: 1,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },

  movieDuration: {
    fontSize: '12px',
    color: '#666',
    margin: '4px 0'
  },

  movieReleaseDate: {
    fontSize: '13px',
    color: '#e50914',
    margin: '8px 0 0 0',
    fontWeight: '500'
  },

  showtimeText: {
    fontSize: '12px',
    color: '#333',
    margin: '8px 0 0 0',
    lineHeight: 1.4
  },

  buyButton: {
    margin: '12px 16px 16px 16px',
    padding: '10px 16px',
    backgroundColor: '#e50914',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },

  loadingContainer: {
    textAlign: 'center',
    padding: '60px 20px'
  },

  loadingText: {
    fontSize: '16px',
    color: '#999'
  },

  emptyContainer: {
    textAlign: 'center',
    padding: '60px 20px'
  },

  emptyText: {
    fontSize: '16px',
    color: '#999'
  },

  viewAllContainer: {
    textAlign: 'center',
    paddingTop: '40px'
  },

  viewAllButton: {
    backgroundColor: '#e50914',
    color: 'white',
    border: 'none',
    padding: '12px 40px',
    fontSize: '16px',
    fontWeight: 'bold',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  }
};

export default Home;
