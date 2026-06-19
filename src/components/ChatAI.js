import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Mic } from 'lucide-react';
import api from '../api/axios';
import { useToast } from './Toast';

const ChatAI = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { text: "Chào bạn!  Mình là AI tư vấn phim của TTV. Bạn cần tìm phim hay lịch chiếu thế nào?", isBot: true }
    ]);
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef(null);
    const toast = useToast();

    // --- Logic Nhận diện giọng nói (Micro) ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;

    if (recognition) {
        recognition.continuous = false;
        recognition.lang = 'vi-VN';
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            setIsListening(false);
        };

        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
    }

    const toggleListen = () => {
        if (!recognition) {
            toast.warning("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
            return;
        }
        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
            setIsListening(true);
        }
    };

    // Tự động cuộn xuống khi có tin nhắn mới
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const newMessages = [...messages, { text: input, isBot: false }];
        setMessages(newMessages);
        const currentInput = input;
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/ai/chat', { userMessage: currentInput });
            setMessages([...newMessages, { text: res.data.reply, isBot: true }]);
        } catch (err) {
            setMessages([...newMessages, { text: "Lỗi kết nối AI rồi!", isBot: true }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '25px', right: '25px', zIndex: 2000, fontFamily: 'Arial, sans-serif' }}>
            {/* Nút tròn mở Chat */}
            {!isOpen ? (
                <button onClick={() => setIsOpen(true)} style={fabStyle}>
                    <MessageCircle size={28} />
                </button>
            ) : (
                /* Khung Hộp Chat */
                <div style={chatBoxStyle}>
                    {/* Header */}
                    <div style={headerStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', background: '#4cd137', borderRadius: '50%' }}></div>
                            <span>TTV Movie AI</span>
                        </div>
                        <X size={20} onClick={() => setIsOpen(false)} style={{ cursor: 'pointer', opacity: 0.8 }} />
                    </div>
                    
                    {/* Vùng Tin Nhắn */}
                    <div ref={scrollRef} style={messageAreaStyle}>
                        {messages.map((m, i) => (
                            <div key={i} style={{ 
                                display: 'flex',
                                justifyContent: m.isBot ? 'flex-start' : 'flex-end',
                                margin: '12px 0',
                                alignItems: 'flex-start'
                            }}>
                                {/* Avatar Robot hiển thị bên cạnh tin nhắn AI */}
                                {m.isBot && <div style={{ marginRight: '8px', fontSize: '18px', marginTop: '4px' }}>🤖</div>}
                                
                                <div style={{ 
                                    background: m.isBot ? '#2c2c2c' : '#e50914', 
                                    padding: '10px 14px', 
                                    borderRadius: m.isBot ? '4px 14px 14px 14px' : '14px 14px 4px 14px', 
                                    fontSize: '14px',
                                    lineHeight: '1.4',
                                    maxWidth: '75%',
                                    color: 'white',
                                    whiteSpace: 'pre-line', // Giữ nguyên cấu trúc xuống dòng từ Backend
                                    wordBreak: 'break-word'
                                }}>
                                    {m.text}
                                </div>
                            </div>
                        ))}

                        {/* Hoạt ảnh 3 chấm đang gõ (Typing Indicator) chuẩn đẹp */}
                        {loading && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '12px 0', alignItems: 'center' }}>
                                <div style={{ marginRight: '8px', fontSize: '18px' }}>🤖</div>
                                <div style={typingBubbleStyle}>
                                    <div style={typingDotStyle}></div>
                                    <div style={{...typingDotStyle, animationDelay: '0.2s'}}></div>
                                    <div style={{...typingDotStyle, animationDelay: '0.4s'}}></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Thanh Nhập Liệu */}
                    <div style={inputAreaStyle}>
                        <button 
                            onClick={toggleListen} 
                            style={{...iconBtnStyle, color: isListening ? '#e50914' : '#bbb'}}
                            title="Nói để nhập liệu"
                        >
                            <Mic size={20} />
                        </button>

                        <input 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={isListening ? "Đang lắng nghe..." : "Nhập yêu cầu..."}
                            style={inputStyle} 
                            disabled={loading}
                        />

                        <button onClick={handleSend} style={sendBtnStyle} disabled={loading || !input.trim()}>
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* CSS Animation cho dấu 3 chấm nhảy múa */}
            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
            `}</style>
        </div>
    );
};

// ==========================================
// HỆ THỐNG CSS OBJECT (SỬA ĐỔI TỪ BAN ĐẦU)
// ==========================================
const fabStyle = { 
    background: '#e50914', 
    border: 'none', 
    borderRadius: '50%', 
    width: '56px',
    height: '56px',
    cursor: 'pointer', 
    color: 'white', 
    boxShadow: '0 4px 15px rgba(229, 9, 20, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const chatBoxStyle = { 
    width: '340px', 
    height: '480px', 
    background: '#141414', 
    borderRadius: '16px', 
    display: 'flex', 
    flexDirection: 'column', 
    border: '1px solid #262626', 
    color: 'white', 
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    overflow: 'hidden'
};

const headerStyle = { 
    padding: '14px 16px', 
    background: '#1f1f1f', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    fontWeight: 'bold', 
    fontSize: '15px',
    borderBottom: '1px solid #262626' 
};

const messageAreaStyle = { 
    flex: 1, 
    overflowY: 'auto', 
    padding: '16px' 
};

const inputAreaStyle = { 
    padding: '12px', 
    display: 'flex', 
    gap: '8px', 
    borderTop: '1px solid #262626', 
    alignItems: 'center',
    background: '#1f1f1f'
};

const inputStyle = { 
    flex: 1, 
    background: '#2b2b2b', 
    color: 'white', 
    border: '1px solid #3b3b3b', 
    padding: '8px 12px', 
    borderRadius: '20px', 
    outline: 'none',
    fontSize: '14px'
};

const sendBtnStyle = { 
    background: '#e50914', 
    border: 'none', 
    color: 'white', 
    borderRadius: '50%', 
    width: '34px',
    height: '34px',
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
};

const iconBtnStyle = { 
    background: 'none', 
    border: 'none', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    padding: '4px'
};

// Khối bọc hiệu ứng 3 chấm gõ
const typingBubbleStyle = {
    background: '#2c2c2c',
    padding: '12px 16px',
    borderRadius: '4px 14px 14px 14px',
    display: 'flex',
    gap: '4px',
    alignItems: 'center'
};

const typingDotStyle = {
    width: '6px',
    height: '6px',
    background: '#aaa',
    borderRadius: '50%',
    animation: 'bounce 1.4s infinite ease-in-out'
};

export default ChatAI;