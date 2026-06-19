import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, X, Mic, MicOff, Sparkles, Film } from 'lucide-react';
import api from '../api/axios';
import { useToast } from './Toast';

// ─── Suggested quick prompts ───────────────────────────────────────────────
const QUICK_PROMPTS = [
    '🎬 Phim đang hot nhất?',
    '🎟️ Suất chiếu tối nay?',
    '💰 Giá vé bao nhiêu?',
    '🍿 Gợi ý phim hành động',
];

// ─── Render markdown-lite: **bold**, xuống dòng, bullet ─────────────────────
const MessageText = ({ text }) => {
    const lines = text.split('\n');
    return (
        <span>
            {lines.map((line, i) => {
                const parts = line.split(/\*\*(.*?)\*\*/g);
                return (
                    <React.Fragment key={i}>
                        {parts.map((p, j) =>
                            j % 2 === 1 ? <strong key={j} style={{ fontWeight: 600 }}>{p}</strong> : p
                        )}
                        {i < lines.length - 1 && <br />}
                    </React.Fragment>
                );
            })}
        </span>
    );
};

// ─── Typing dots animation ───────────────────────────────────────────────────
const TypingDots = () => (
    <div style={styles.typingWrap}>
        <div style={styles.botAvatar}><Film size={12} /></div>
        <div style={styles.typingBubble}>
            {[0, 1, 2].map(i => (
                <span key={i} style={{ ...styles.dot, animationDelay: `${i * 0.18}s` }} />
            ))}
        </div>
    </div>
);

// ─── Main component ──────────────────────────────────────────────────────────
const ChatAI = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        {
            text: 'Xin chào! Mình là AI tư vấn của rạp **TTV Cinema** 🎬\nMình có thể giúp bạn tìm phim, xem suất chiếu và đặt vé. Bạn cần gì nào?',
            isBot: true,
            id: 0,
        },
    ]);
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [unread, setUnread] = useState(0);
    const scrollRef = useRef(null);
    const inputRef = useRef(null);
    const toast = useToast();
    const msgId = useRef(1);

    // ── Speech recognition ───────────────────────────────────────────────────
    const recognitionRef = useRef(null);
    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;
        const r = new SR();
        r.continuous = false;
        r.lang = 'vi-VN';
        r.onresult = (e) => { setInput(e.results[0][0].transcript); setIsListening(false); };
        r.onend = () => setIsListening(false);
        r.onerror = () => setIsListening(false);
        recognitionRef.current = r;
    }, []);

    const toggleListen = () => {
        if (!recognitionRef.current) {
            toast.warning('Trình duyệt không hỗ trợ nhận diện giọng nói.');
            return;
        }
        if (isListening) { recognitionRef.current.stop(); }
        else { recognitionRef.current.start(); setIsListening(true); }
    };

    // ── Auto scroll ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    // ── Unread badge ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen && messages.length > 1) {
            const botCount = messages.filter(m => m.isBot).length - 1;
            setUnread(botCount > 0 ? botCount : 0);
        }
        if (isOpen) setUnread(0);
    }, [messages, isOpen]);

    // ── Focus input on open ──────────────────────────────────────────────────
    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
    }, [isOpen]);

    // ── Send message ─────────────────────────────────────────────────────────
    const handleSend = useCallback(async (text) => {
        const msg = (text || input).trim();
        if (!msg || loading) return;

        const userMsg = { text: msg, isBot: false, id: msgId.current++ };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/ai/chat', { userMessage: msg });
            const botMsg = { text: res.data.reply, isBot: true, id: msgId.current++ };
            setMessages(prev => [...prev, botMsg]);
        } catch {
            setMessages(prev => [...prev, {
                text: 'Kết nối bị gián đoạn. Bạn thử lại nhé! 😅',
                isBot: true,
                id: msgId.current++,
            }]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [input, loading]);

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <>
            {/* Inject keyframe animations */}
            <style>{cssKeyframes}</style>

            <div style={styles.root}>
                {/* ── FAB button ── */}
                {!isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        style={styles.fab}
                        title="Mở AI tư vấn phim"
                        aria-label="Mở chat AI"
                    >
                        <div style={styles.fabGlow} />
                        <MessageCircle size={26} />
                        {unread > 0 && (
                            <span style={styles.badge}>{unread > 9 ? '9+' : unread}</span>
                        )}
                    </button>
                )}

                {/* ── Chat window ── */}
                {isOpen && (
                    <div style={styles.window} role="dialog" aria-label="AI tư vấn phim">

                        {/* Header */}
                        <div style={styles.header}>
                            <div style={styles.headerLeft}>
                                <div style={styles.headerIcon}>
                                    <Sparkles size={16} />
                                </div>
                                <div>
                                    <div style={styles.headerTitle}>TTV AI Assistant</div>
                                    <div style={styles.headerSub}>
                                        <span style={styles.onlineDot} />
                                        Đang hoạt động
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} style={styles.closeBtn} aria-label="Đóng">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} style={styles.body}>
                            {messages.map((m) => (
                                <div key={m.id} style={{ ...styles.msgRow, justifyContent: m.isBot ? 'flex-start' : 'flex-end' }}>
                                    {m.isBot && (
                                        <div style={styles.botAvatar}><Film size={12} /></div>
                                    )}
                                    <div style={m.isBot ? styles.botBubble : styles.userBubble}>
                                        <MessageText text={m.text} />
                                    </div>
                                </div>
                            ))}
                            {loading && <TypingDots />}
                        </div>

                        {/* Quick prompts */}
                        {messages.length <= 2 && !loading && (
                            <div style={styles.quickWrap}>
                                {QUICK_PROMPTS.map((q) => (
                                    <button
                                        key={q}
                                        style={styles.quickBtn}
                                        onClick={() => handleSend(q)}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,9,20,0.15)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div style={styles.footer}>
                            <button
                                onClick={toggleListen}
                                style={{ ...styles.iconBtn, color: isListening ? '#ff4d4d' : '#666' }}
                                title="Nhập bằng giọng nói"
                                aria-label={isListening ? 'Dừng nghe' : 'Nói để nhập'}
                            >
                                {isListening
                                    ? <MicOff size={18} />
                                    : <Mic size={18} />
                                }
                            </button>

                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKey}
                                placeholder={isListening ? '🎙 Đang nghe...' : 'Hỏi về phim, vé, suất chiếu...'}
                                style={styles.textarea}
                                disabled={loading}
                                rows={1}
                                aria-label="Tin nhắn"
                            />

                            <button
                                onClick={() => handleSend()}
                                style={{
                                    ...styles.sendBtn,
                                    opacity: (!input.trim() || loading) ? 0.4 : 1,
                                    cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
                                }}
                                disabled={!input.trim() || loading}
                                aria-label="Gửi"
                            >
                                <Send size={16} />
                            </button>
                        </div>

                        <div style={styles.footerNote}>Powered by Gemini · TTV Cinema</div>
                    </div>
                )}
            </div>
        </>
    );
};

// ─── CSS keyframes ────────────────────────────────────────────────────────────
const cssKeyframes = `
@keyframes ttv-bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40%           { transform: translateY(-5px); opacity: 1; }
}
@keyframes ttv-fab-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(229,9,20,0.5), 0 8px 24px rgba(229,9,20,0.35); }
    50%       { box-shadow: 0 0 0 10px rgba(229,9,20,0), 0 8px 24px rgba(229,9,20,0.35); }
}
@keyframes ttv-slide-up {
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
}
`;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
    root: {
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 2000,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },

    // FAB
    fab: {
        position: 'relative',
        width: 58,
        height: 58,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #e50914 0%, #b0060f 100%)',
        border: 'none',
        cursor: 'pointer',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'ttv-fab-pulse 2.8s ease-in-out infinite',
        transition: 'transform 0.2s',
    },
    fabGlow: {
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        background: '#fff',
        color: '#e50914',
        fontSize: 10,
        fontWeight: 700,
        width: 18,
        height: 18,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid #e50914',
    },

    // Window
    window: {
        width: 360,
        height: 540,
        background: '#141414',
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(229,9,20,0.1)',
        animation: 'ttv-slide-up 0.25s cubic-bezier(0.34,1.56,0.64,1)',
    },

    // Header
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        background: 'linear-gradient(135deg, #1c0c0d 0%, #1a1a1a 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
    headerIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        background: 'linear-gradient(135deg, #e50914, #ff3a46)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        flexShrink: 0,
    },
    headerTitle: { fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: 0.2 },
    headerSub: {
        fontSize: 11,
        color: '#888',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    onlineDot: {
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: '#22c55e',
        boxShadow: '0 0 6px #22c55e',
        flexShrink: 0,
    },
    closeBtn: {
        background: 'rgba(255,255,255,0.07)',
        border: 'none',
        color: '#aaa',
        cursor: 'pointer',
        borderRadius: 8,
        padding: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s',
    },

    // Body
    body: {
        flex: 1,
        overflowY: 'auto',
        padding: '16px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255,255,255,0.1) transparent',
    },

    // Messages
    msgRow: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: 6,
    },
    botAvatar: {
        width: 26,
        height: 26,
        borderRadius: 8,
        background: 'linear-gradient(135deg, #e50914, #ff3a46)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        flexShrink: 0,
    },
    botBubble: {
        background: '#242424',
        border: '1px solid rgba(255,255,255,0.07)',
        color: '#e8e8e8',
        padding: '10px 13px',
        borderRadius: '16px 16px 16px 4px',
        fontSize: 13.5,
        lineHeight: 1.6,
        maxWidth: '80%',
    },
    userBubble: {
        background: 'linear-gradient(135deg, #e50914, #c4070f)',
        color: '#fff',
        padding: '10px 13px',
        borderRadius: '16px 16px 4px 16px',
        fontSize: 13.5,
        lineHeight: 1.6,
        maxWidth: '80%',
        boxShadow: '0 4px 12px rgba(229,9,20,0.3)',
    },

    // Typing
    typingWrap: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: 6,
    },
    typingBubble: {
        background: '#242424',
        border: '1px solid rgba(255,255,255,0.07)',
        padding: '12px 16px',
        borderRadius: '16px 16px 16px 4px',
        display: 'flex',
        gap: 5,
        alignItems: 'center',
    },
    dot: {
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: '#e50914',
        animation: 'ttv-bounce 1.2s ease-in-out infinite',
    },

    // Quick prompts
    quickWrap: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        padding: '0 14px 12px',
    },
    quickBtn: {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#ccc',
        padding: '6px 11px',
        borderRadius: 20,
        fontSize: 11.5,
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
        whiteSpace: 'nowrap',
    },

    // Footer
    footer: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: '#111',
        flexShrink: 0,
    },
    iconBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 6,
        borderRadius: 8,
        transition: 'color 0.2s, background 0.2s',
        flexShrink: 0,
    },
    textarea: {
        flex: 1,
        background: 'rgba(255,255,255,0.06)',
        color: '#e8e8e8',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '9px 12px',
        borderRadius: 12,
        outline: 'none',
        fontSize: 13,
        lineHeight: 1.4,
        resize: 'none',
        maxHeight: 80,
        overflowY: 'auto',
        fontFamily: 'inherit',
    },
    sendBtn: {
        width: 36,
        height: 36,
        background: 'linear-gradient(135deg, #e50914, #c4070f)',
        border: 'none',
        color: '#fff',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'opacity 0.2s, transform 0.15s',
        boxShadow: '0 4px 12px rgba(229,9,20,0.35)',
    },
    footerNote: {
        textAlign: 'center',
        fontSize: 10,
        color: '#3a3a3a',
        padding: '0 0 8px',
        background: '#111',
        letterSpacing: 0.3,
    },
};

export default ChatAI;