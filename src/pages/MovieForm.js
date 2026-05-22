import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toDateInputValue } from '../utils/date';

const MovieForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const [movie, setMovie] = useState({
        title: '',
        description: '',
        duration: '',
        genre: '',
        youtube_trailer_url: '',
        release_date: ''
    });
    const [file, setFile] = useState(null);

    useEffect(() => {
        if (id) {
            api.get(`/movies/${id}`).then(res => {
                const date = toDateInputValue(res.data.release_date);
                setMovie({ ...res.data, release_date: date });
            });
        }
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', movie.title);
        formData.append('description', movie.description);
        formData.append('duration', movie.duration);
        formData.append('genre', movie.genre);
        formData.append('youtube_trailer_url', movie.youtube_trailer_url);
        formData.append('trailer_url', movie.youtube_trailer_url);
        formData.append('release_date', movie.release_date);
        formData.append('userId', user.id);
        if (file) formData.append('poster', file);

        try {
            if (id) {
                await api.put(`/admin/movies/edit/${id}`, formData);
            } else {
                await api.post('/admin/movies/add', formData);
            }
            alert('Thao tác thành công!');
            navigate('/admin');
        } catch (err) {
            alert('Lỗi: ' + (err.response?.data?.message || 'Không thể xử lý'));
        }
    };

    return (
        <div style={containerStyle}>
            <h3 style={titleStyle}>{id ? 'Cập Nhật Phim' : 'Thêm Phim Mới'}</h3>
            <form onSubmit={handleSubmit}>
                <label style={fieldStyle}>
                    <span style={labelStyle}>Tên phim</span>
                    <input
                        type="text"
                        placeholder="Tên phim"
                        style={inputStyle}
                        value={movie.title}
                        onChange={e => setMovie({ ...movie, title: e.target.value })}
                        required
                    />
                </label>

                <label style={fieldStyle}>
                    <span style={labelStyle}>Mô tả</span>
                    <textarea
                        placeholder="Mô tả"
                        style={inputStyle}
                        value={movie.description}
                        onChange={e => setMovie({ ...movie, description: e.target.value })}
                    />
                </label>

                <div style={rowStyle}>
                    <label style={fieldStyle}>
                        <span style={labelStyle}>Thể loại</span>
                        <input
                            type="text"
                            placeholder="Thể loại"
                            style={inputStyle}
                            value={movie.genre}
                            onChange={e => setMovie({ ...movie, genre: e.target.value })}
                        />
                    </label>

                    <label style={fieldStyle}>
                        <span style={labelStyle}>Thời lượng (phút)</span>
                        <input
                            type="number"
                            placeholder="Thời lượng (phút)"
                            style={inputStyle}
                            value={movie.duration}
                            onChange={e => setMovie({ ...movie, duration: e.target.value })}
                        />
                    </label>
                </div>

                <label style={fieldStyle}>
                    <span style={labelStyle}>Link YouTube trailer</span>
                    <input
                        type="text"
                        placeholder="Link YouTube trailer"
                        style={inputStyle}
                        value={movie.youtube_trailer_url}
                        onChange={e => setMovie({ ...movie, youtube_trailer_url: e.target.value })}
                    />
                </label>

                <label style={fieldStyle}>
                    <span style={labelStyle}>Ngày khởi chiếu phim</span>
                    <input
                        type="date"
                        lang="vi-VN"
                        style={inputStyle}
                        value={movie.release_date}
                        onChange={e => setMovie({ ...movie, release_date: e.target.value })}
                    />
                </label>

                <label style={fieldStyle}>
                    <span style={labelStyle}>Poster phim</span>
                    <input type="file" onChange={e => setFile(e.target.files[0])} />
                </label>

                <button type="submit" style={btnSubmit}>
                    {id ? 'Lưu thay đổi' : 'Thêm phim'}
                </button>
            </form>
        </div>
    );
};

const containerStyle = {
    maxWidth: '760px',
    margin: '50px auto',
    color: 'white',
    background: '#222',
    padding: '36px',
    borderRadius: '10px'
};

const titleStyle = {
    margin: '0 0 28px',
    fontSize: '24px'
};

const rowStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
};

const fieldStyle = {
    display: 'block',
    marginBottom: '16px'
};

const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    color: '#ddd',
    fontSize: '14px',
    fontWeight: 600
};

const inputStyle = {
    width: '100%',
    padding: '12px',
    background: '#111',
    color: 'white',
    border: '1px solid #444',
    borderRadius: '5px',
    boxSizing: 'border-box',
    fontSize: '15px'
};

const btnSubmit = {
    width: '100%',
    padding: '12px',
    background: '#e50914',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
    marginTop: '8px'
};

export default MovieForm;
