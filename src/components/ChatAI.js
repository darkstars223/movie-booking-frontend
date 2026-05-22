import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Mic, MicOff } from 'lucide-react';
import api from '../api/axios';

const ChatAI = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([{ text: "Chào bạn! Mình là AI tư vấn phim. Bạn cần tìm phim gì?", isBot: true }]);
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef(null);

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
            alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
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
    }, [messages]);

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
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 2000 }}>
            {!isOpen ? (
                <button onClick={() => setIsOpen(true)} style={fabStyle}>
                    <MessageCircle size={30} />
                </button>
            ) : (
                <div style={chatBoxStyle}>
                    <div style={headerStyle}>
                        <span>🎬 Movie AI Assistant</span>
                        <X size={20} onClick={() => setIsOpen(false)} style={{ cursor: 'pointer' }} />
                    </div>
                    
                    <div ref={scrollRef} style={messageAreaStyle}>
                        {messages.map((m, i) => (
                            <div key={i} style={{ textAlign: m.isBot ? 'left' : 'right', margin: '10px 0' }}>
                                <span style={{ 
                                    background: m.isBot ? '#333' : '#e50914', 
                                    padding: '8px 12px', 
                                    borderRadius: '12px', 
                                    fontSize: '14px',
                                    display: 'inline-block',
                                    maxWidth: '80%',
                                    color: 'white'
                                }}>
                                    {m.text}
                                </span>
                            </div>
                        ))}
                        {loading && <div style={{ fontSize: '12px', color: '#888', marginLeft: '5px' }}>AI đang suy nghĩ...</div>}
                    </div>

                    <div style={inputAreaStyle}>
                        <button 
                            onClick={toggleListen} 
                            style={{...iconBtnStyle, color: isListening ? '#ff4d4d' : '#bbb'}}
                            title="Nói để nhập liệu"
                        >
                            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>

                        <input 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={isListening ? "Đang nghe..." : "Nhập yêu cầu..."}
                            style={inputStyle} 
                            disabled={loading}
                        />

                        <button onClick={handleSend} style={sendBtnStyle} disabled={loading || !input.trim()}>
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Styles
const fabStyle = { background: '#e50914', border: 'none', borderRadius: '50%', padding: '15px', cursor: 'pointer', color: 'white', boxShadow: '0 4px 15px rgba(229, 9, 20, 0.4)' };
const chatBoxStyle = { width: '320px', height: '450px', background: '#1a1a1a', borderRadius: '15px', display: 'flex', flexDirection: 'column', border: '1px solid #333', color: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' };
const headerStyle = { padding: '15px', background: '#222', display: 'flex', justifyContent: 'space-between', borderRadius: '15px 15px 0 0', fontWeight: 'bold', borderBottom: '1px solid #333' };
const messageAreaStyle = { flex: 1, overflowY: 'auto', padding: '15px' };
const inputAreaStyle = { padding: '10px', display: 'flex', gap: '8px', borderTop: '1px solid #333', alignItems: 'center' };
const inputStyle = { flex: 1, background: '#111', color: 'white', border: '1px solid #444', padding: '10px', borderRadius: '5px', outline: 'none' };
const sendBtnStyle = { background: '#e50914', border: 'none', color: 'white', borderRadius: '5px', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '5px', transition: '0.3s' };

export default ChatAI;