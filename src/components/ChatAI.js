import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Mic, MicOff, Tv } from 'lucide-react';
import api from '../api/axios';
import { useToast } from './Toast';

const ChatAI = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { text: "Xin chào! 👋 Mình là trợ lý ảo của rạp phim TTV. Bạn cần tra cứu phim hay lịch chiếu hôm nay thế nào?", isBot: true }
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

    // Tự động cuộn xuống mượt mà khi có tin nhắn mới
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
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
            setMessages([...newMessages, { text: "😥 Lỗi kết nối đến máy chủ AI rồi. Bạn thử lại nhé!", isBot: true }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 2000, fontFamily: 'Segoe UI, Roboto, sans-serif' }}>
            {/* Nút bấm mở chat (FAB) với hiệu ứng Scale ẩn hiện */}
            {!isOpen ? (
                <button onClick={() => setIsOpen(true)} style={fabStyle} title="Trò chuyện với AI">
                    <MessageSquare size={26} />
                    <span style={badgeStyle}>AI</span>
                </button>
            ) : (
                /* Khung Chat Chính */
                <div style={chatBoxStyle}>
                    {/* Header cao cấp */}
                    <div style={headerStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={botIconBgStyle}>
                                <Tv size={16} color="#white" />
                            </div>
                            <div>
                                <div style={{ fontSize: '15px', fontWeight: 'bold', letterSpacing: '0.5px' }}>TTV Movie AI</div>
                                <div style={{ fontSize: '11px', color: '#4cd137', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={onlineDotStyle}></span> Đang trực tuyến
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={closeBtnStyle}>
                            <X size={18} />
                        </button>
                    </div>
                    
                    {/* Khu vực hiển thị tin nhắn */}
                    <div ref={scrollRef} style={messageAreaStyle}>
                        {messages.map((m, i) => (
                            <div key={i} style={{ 
                                display: 'flex', 
                                justifyContent: m.isBot ? 'flex-start' : 'flex-end', 
                                margin: '14px 0',
                                animation: 'fadeIn 0.3s ease'
                            }}>
                                {/* Avatar cho Bot */}
                                {m.isBot && <div style={msgAvatarStyle}>🤖</div>}
                                
                                <span style={{ 
                                    background: m.isBot ? '#262626' : 'linear-gradient(135deg, #e50914, #b20710)', 
                                    padding: '10px 14px', 
                                    borderRadius: m.isBot ? '4px 14px 14px 14px' : '14px 14px 4px 14px', 
                                    fontSize: '13.5px',
                                    lineHeight: '1.5',
                                    maxWidth: '75%',
                                    color: '#f5f5f5',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    whiteSpace: 'pre-line', // Xuống dòng chuẩn từ dữ liệu Server
                                }}>
                                    {m.text}
                                </span>
                            </div>
                        ))}
                        
                        {/* Hiệu ứng 3 chấm đang gõ (Typing Indicator) khi AI suy nghĩ */}
                        {loading && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '10px 0' }}>
                                <div style={msgAvatarStyle}>🤖</div>
                                <div style={typingBubbleStyle}>
                                    <div style={typingDotStyle}></div>
                                    <div style={{...typingDotStyle, animationDelay: '0.2s'}}></div>
                                    <div style={{...typingDotStyle, animationDelay: '0.4s'}}></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Khu vực nhập liệu */}
                    <div style={inputAreaStyle}>
                        <button 
                            onClick={toggleListen} 
                            style={{...iconBtnStyle, color: isListening ? '#e50914' : '#aaaaaa'}}
                            title={isListening ? "Đang lắng nghe..." : "Nói để nhập liệu"}
                        >
                            {isListening ? <MicOff size={20} style={{ animation: 'pulse 1s infinite' }} /> : <Mic size={20} />}
                        </button>

                        <input 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={isListening ? "Đang nghe giọng nói của bạn..." : "Hỏi AI về phim, suất chiếu..."}
                            style={inputStyle} 
                            disabled={loading}
                        />

                        <button 
                            onClick={handleSend} 
                            style={{
                                ...sendBtnStyle, 
                                opacity: (!input.trim() || loading) ? 0.5 : 1,
                                cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer'
                            }} 
                            disabled={loading || !input.trim()}
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Chèn mã CSS Keyframes vào giao diện */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

// ==========================================
// HỆ THỐNG STYLE ĐẸP (DARK THEME CHUẨN ĐIỆN ẢNH)
// ==========================================
const fabStyle = { 
    background: 'linear-gradient(135deg, #e50914, #b20710)', 
    border: 'none', 
    borderRadius: '50%', 
    width: '60px', 
    height: '60px', 
    cursor: 'pointer', 
    color: 'white', 
    boxShadow: '0 4px 20px rgba(229, 9, 20, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transition: 'transform 0.2s ease',
    outline: 'none'
};

const badgeStyle = {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    background: '#ffffff',
    color: '#e50914',
    fontSize: '9px',
    fontWeight: 'bold',
    padding: '2px 5px',
    borderRadius: '10px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
};

const chatBoxStyle = { 
    width: '360px', 
    height: '520px', 
    background: '#141414', // Nền tối sâu phong cách Netflix
    borderRadius: '16px', 
    display: 'flex', 
    flexDirection: 'column', 
    border: '1px solid #282828', 
    color: 'white', 
    boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
    overflow: 'hidden',
    animation: 'fadeIn 0.25s ease-out'
};

const headerStyle = { 
    padding: '16px', 
    background: '#1f1f1f', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderBottom: '1px solid #282828' 
};

const botIconBgStyle = {
    background: '#e50914',
    borderRadius: '50%',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const onlineDotStyle = {
    width: '7px',
    height: '7px',
    background: '#4cd137',
    borderRadius: '50%',
    display: 'inline-block'
};

const closeBtnStyle = {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '50%',
    transition: 'background 0.2s',
    display: 'flex',
    alignItems: 'center'
};

const messageAreaStyle = { 
    flex: 1, 
    overflowY: 'auto', 
    padding: '20px 16px',
    background: '#141414',
    scrollBehavior: 'smooth'
};

const msgAvatarStyle = {
    marginRight: '8px',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center'
};

const inputAreaStyle = { 
    padding: '14px', 
    display: 'flex', 
    gap: '10px', 
    borderTop: '1px solid #282828', 
    alignItems: 'center',
    background: '#1f1f1f'
};

const inputStyle = { 
    flex: 1, 
    background: '#2b2b2b', 
    color: 'white', 
    border: '1px solid #3a3a3a', 
    padding: '10px 14px', 
    borderRadius: '20px', // Bo tròn góc hiện đại
    outline: 'none',
    fontSize: '13.5px',
    transition: 'border-color 0.2s'
};

const sendBtnStyle = { 
    background: 'linear-gradient(135deg, #e50914, #b20710)', 
    border: 'none', 
    color: 'white', 
    borderRadius: '50%', 
    width: '36px',
    height: '36px',
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(229, 9, 20, 0.3)',
    transition: 'transform 0.1s ease'
};

const iconBtnStyle = { 
    background: 'none', 
    border: 'none', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    padding: '4px',
    transition: 'color 0.2s' 
};

// Style cho khối 3 chấm nhấp nháy khi gõ tin nhắn
const typingBubbleStyle = {
    background: '#262626',
    padding: '12px 16px',
    borderRadius: '4px 14px 14px 14px',
    display: 'flex',
    gap: '4px',
    alignItems: 'center'
};

const typingDotStyle = {
    width: '6px',
    height: '6px',
    background: '#888',
    borderRadius: '50%',
    animation: 'bounce 1.4s infinite ease-in-out both'
};

export default ChatAI;