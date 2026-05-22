import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { formatDateOnly } from '../utils/date';

const convertYoutubeUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1];
    } else if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('youtube.com/watch?v=')[1];
    } else if (url.includes('youtube.com/embed/')) {
        return url;
    } else {
        videoId = url;
    }
    return `https://www.youtube.com/embed/${videoId}`;
};

const MovieDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [showtimes, setShowtimes] = useState([]);

    useEffect(() => {
        api.get(`/movies/${id}`)
            .then(res => setMovie(res.data))
            .catch(err => console.error("Lỗi lấy chi tiết phim:", err));

        api.get(`/movies/${id}/showtimes`)
            .then(res => setShowtimes(res.data))
            .catch(err => console.error("Lỗi lấy suất chiếu:", err));
    }, [id]);

    if (!movie) return (
        <div style={{ padding: '50px 5%', color: '#999', backgroundColor: '#fafafa', minHeight: '100vh' }}>
            Đang tải thông tin phim...
        </div>
    );

    return (
        <div style={styles.container}>

            {/* Trailer */}
            {movie.youtube_trailer_url && (
                <div style={styles.trailerWrapper}>
                    <iframe
                        width="100%"
                        height="500"
                        src={convertYoutubeUrl(movie.youtube_trailer_url)}
                        title="Trailer"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ display: 'block' }}
                    />
                </div>
            )}

            {/* Movie Info */}
            <div style={styles.infoSection}>
                {/* Poster */}
                <div style={styles.posterWrapper}>
                    <img
                        src={movie.poster_url?.startsWith('http') ? movie.poster_url : `${import.meta.env.VITE_API_BASE_URL}${movie.poster_url}`}
                        alt={movie.title}
                        style={styles.poster}
                    />
                </div>

                {/* Detail */}
                <div style={styles.detail}>
                    <div style={styles.sectionHeader}>
                        <h1 style={styles.title}>{movie.title}</h1>
                    </div>

                    <p style={styles.meta}>
                        {movie.genre} &nbsp;|&nbsp; {movie.duration} phút &nbsp;|&nbsp; Khởi chiếu: {formatDateOnly(movie.release_date)}
                    </p>

                    <p style={styles.description}>{movie.description}</p>

                    {/* Showtimes */}
                    <div style={styles.showtimeSection}>
                        <div style={styles.showtimeHeader}>
                            <h3 style={styles.showtimeTitle}>Chọn Suất Chiếu</h3>
                        </div>

                        <div style={styles.showtimeGrid}>
                            {showtimes.length > 0 ? (
                                showtimes.map(st => (
                                    <ShowtimeCard
                                        key={st.id}
                                        st={st}
                                        onClick={() => navigate(`/select-seat/${st.id}`)}
                                    />
                                ))
                            ) : (
                                <p style={styles.emptyText}>Hiện chưa có suất chiếu cho phim này.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ShowtimeCard = ({ st, onClick }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                ...styles.showtimeCard,
                backgroundColor: hovered ? '#e50914' : '#fff',
                color: hovered ? '#fff' : '#333',
                boxShadow: hovered
                    ? '0 4px 16px rgba(229,9,20,0.25)'
                    : '0 2px 8px rgba(0,0,0,0.08)',
            }}
        >
            <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '6px', opacity: hovered ? 1 : 0.7 }}>
                {st.theater_name}{st.room_name ? ` — ${st.room_name}` : ''}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', margin: '4px 0' }}>
                {new Date(st.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </div>
            <div style={{ fontSize: '12px', opacity: hovered ? 0.85 : 0.5 }}>
                {new Date(st.start_time).toLocaleDateString('vi-VN')}
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '40px 5%',
        backgroundColor: '#fafafa',
        minHeight: '100vh',
        color: '#333',
    },

    trailerWrapper: {
        marginBottom: '40px',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    },

    infoSection: {
        display: 'flex',
        gap: '40px',
        alignItems: 'flex-start',
    },

    posterWrapper: {
        flex: '0 0 260px',
    },

    poster: {
        width: '100%',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        display: 'block',
    },

    detail: {
        flex: '1',
    },

    // Matches Home sectionHeader
    sectionHeader: {
        borderBottom: '3px solid #333',
        paddingBottom: '15px',
        marginBottom: '16px',
    },

    title: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#333',
        margin: 0,
    },

    meta: {
        color: '#e50914',
        fontWeight: '500',
        fontSize: '14px',
        margin: '0 0 20px 0',
    },

    description: {
        lineHeight: '1.7',
        fontSize: '15px',
        color: '#555',
        margin: '0 0 32px 0',
    },

    showtimeSection: {
        marginTop: '8px',
    },

    showtimeHeader: {
        borderBottom: '3px solid #333',
        paddingBottom: '15px',
        marginBottom: '20px',
    },

    showtimeTitle: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#333',
        margin: 0,
    },

    showtimeGrid: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
    },

    // Matches Home movieCard style
    showtimeCard: {
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '16px 24px',
        cursor: 'pointer',
        border: '1px solid #eee',
        textAlign: 'center',
        transition: 'all 0.2s ease',
        minWidth: '120px',
    },

    emptyText: {
        color: '#999',
        fontSize: '14px',
    },
};

export default MovieDetail;