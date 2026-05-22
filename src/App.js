import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ChatAI from './components/ChatAI';
import Home from './pages/Home';
import Movies from './pages/Movies';
import MovieDetail from './pages/MovieDetail';
import SeatSelection from './pages/SeatSelection';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import MovieForm from './pages/MovieForm';
import MyTickets from './pages/MyTickets';
import Payment from './pages/Payment';
import ChangePassword from './pages/ChangePassword';

function App() {
  return (
    <Router>
      <div style={{ backgroundColor: '#141414', minHeight: '100vh', color: 'white' }}>
        <Header />
        
        {/* Hệ thống định tuyến các trang */}
        <Routes>
          {/* 1. Trang chủ: Hiển thị phim nổi bật */}
          <Route path="/" element={<Home />} />
          
          {/* 2. Trang phim: Hiển thị toàn bộ phim với thanh chọn ngày */}
          <Route path="/movies" element={<Movies />} />
         
          {/* 3. Trang chi tiết: Hiển thị thông tin 1 bộ phim và Suất chiếu */}
          <Route path="/movie/:id" element={<MovieDetail />} />
          
          {/* 4. Trang chọn ghế: Hiển thị sơ đồ ghế theo suất chiếu */}
          <Route path="/select-seat/:showtimeId" element={<SeatSelection />} />
          
          {/* 5. Trang vé của tôi: Quản lý vé đã đặt */}
          <Route path="/my-tickets" element={<MyTickets />} />
         
          {/* 6. Trang thay đổi mật khẩu abc*/}
          <Route path="/change-password" element={<ChangePassword />} />
          
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/add" element={<MovieForm />} />
          <Route path="/admin/edit/:id" element={<MovieForm />} />
        <Route path="/payment/:id" element={<Payment />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>

        <ChatAI />
      </div>
    </Router>
  );
}

export default App;