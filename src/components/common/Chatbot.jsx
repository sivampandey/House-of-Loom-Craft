import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  X,
  Send,
  Sparkles,
  ChevronRight,
  Package,
  Tag,
  Grid,
  Lamp,
  Paperclip
} from 'lucide-react';
import { chatAPI } from '../../services/api';

// Safe text renderer: Converts safe Markdown (bold, lists, links) into React elements without dangerouslySetInnerHTML
function SafeFormattedMessage({ text }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-2 text-[13px] sm:text-[13.5px] leading-relaxed font-sans text-[#241C16]">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Check if line is a bullet item
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ');
        const cleanContent = isBullet ? trimmed.replace(/^[-•*]\s+/, '') : trimmed;

        // Parse inline elements (bold **text** and markdown links [text](url))
        const parts = [];
        let partKey = 0;

        const tokenRegex = /(\*\*[^*]+\*\*|\[[^\]]+\]\(\/[^)]+\))/g;
        let match;
        let lastIndex = 0;

        while ((match = tokenRegex.exec(cleanContent)) !== null) {
          if (match.index > lastIndex) {
            parts.push(<span key={partKey++}>{cleanContent.substring(lastIndex, match.index)}</span>);
          }

          const matchedToken = match[0];
          if (matchedToken.startsWith('**') && matchedToken.endsWith('**')) {
            parts.push(
              <strong key={partKey++} className="font-semibold text-[#18120D]">
                {matchedToken.slice(2, -2)}
              </strong>
            );
          } else if (matchedToken.startsWith('[') && matchedToken.includes('](')) {
            const linkText = matchedToken.substring(1, matchedToken.indexOf(']('));
            const linkUrl = matchedToken.substring(matchedToken.indexOf('](') + 2, matchedToken.length - 1);
            if (linkUrl.startsWith('/')) {
              parts.push(
                <Link
                  key={partKey++}
                  to={linkUrl}
                  className="font-medium text-[#1B6BC7] underline underline-offset-2 hover:text-[#0E4A91] transition-colors"
                >
                  {linkText}
                </Link>
              );
            } else {
              parts.push(<span key={partKey++}>{linkText}</span>);
            }
          }

          lastIndex = match.index + matchedToken.length;
        }

        if (lastIndex < cleanContent.length) {
          parts.push(<span key={partKey++}>{cleanContent.substring(lastIndex)}</span>);
        }

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1">
              <span className="text-[#34402D] mt-1.5 text-[7px] select-none">◆</span>
              <div className="flex-1">{parts}</div>
            </div>
          );
        }

        return <p key={lineIdx}>{parts}</p>;
      })}
    </div>
  );
}

export default function Chatbot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const initialGreeting = "Hello 👋\n**Welcome to House of Loom & Craft.**\n\nI’m your AI Concierge. I can help you explore our handcrafted rugs and home decor, find the right piece for your space, and answer questions about orders and offers.\n\nHow may I help you today?";

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: initialGreeting,
      products: [],
      timestamp: '2:43 PM'
    }
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-open chatbot once per browser session after subtle 2.5s delay
  useEffect(() => {
    try {
      const hasSeen = sessionStorage.getItem('pottery_rugs_concierge_seen');
      if (!hasSeen) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          try {
            sessionStorage.setItem('pottery_rugs_concierge_seen', 'true');
          } catch (_) {}
        }, 2500);

        return () => clearTimeout(timer);
      }
    } catch (_) {
      // Graceful fallback if sessionStorage is inaccessible
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem('pottery_rugs_concierge_seen', 'true');
    } catch (_) {}
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          inputRef.current?.focus();
        }
      }, 350);
    }
  }, [isOpen, messages, isLoading]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const quickActions = [
    { label: 'Explore Rugs', icon: Grid, prompt: 'I want to explore your handcrafted rug collections.' },
    { label: 'Home Decor', icon: Lamp, prompt: 'Show me your luxury home decor and artisan accents.' },
    { label: 'Find a Rug', icon: Sparkles, prompt: 'Can you help me choose the right rug for my space?' },
    { label: 'Track My Order', icon: Package, prompt: 'Track my order status' },
    { label: 'Offers & Discounts', icon: Tag, prompt: 'What offers or promotional discounts are currently active?' }
  ];

  const getCurrentTimeString = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setInputMessage('');

    const currentTime = getCurrentTimeString();
    const userMsg = { role: 'user', content: text, timestamp: currentTime };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const historyPayload = updatedMessages
        .slice(1, -1)
        .slice(-6)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const res = await chatAPI.sendMessage(text, historyPayload);

      if (res && res.success) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: res.message || 'I am at your service. How else may I assist you today?',
            products: Array.isArray(res.products) ? res.products : [],
            timestamp: getCurrentTimeString()
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: res?.message || 'I am having a brief connection issue with our atelier records. Please feel free to retry in a moment, or contact our team directly at +91 9839116625.',
            products: [],
            timestamp: getCurrentTimeString()
          }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again in a moment, or contact our team directly at +91 9839116625 for personal assistance.",
          products: [],
          timestamp: getCurrentTimeString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Circular Launcher: Compact 60px Desktop / 56px Mobile */}
      <div className={`fixed right-4 bottom-4 sm:right-6 sm:bottom-6 z-50 select-none ${isOpen ? 'hidden sm:block' : 'block'}`}>
        <motion.button
          id="house-of-loom-craft-concierge-toggle"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          aria-label={isOpen ? "Close House of Loom & Craft Concierge" : "Open House of Loom & Craft Concierge"}
          className="w-14 h-14 sm:w-[60px] sm:h-[60px] rounded-full bg-[#34402D] hover:bg-[#283222] shadow-[0_10px_26px_rgba(0,0,0,0.28),0_2px_6px_rgba(0,0,0,0.18)] border border-[#4B5B41] flex items-center justify-center cursor-pointer transition-colors duration-200 relative group"
        >
          {/* House of Loom & Craft Icon Centered (30-34px in crisp white disc) */}
          <div className="w-[34px] h-[34px] sm:w-[36px] sm:h-[36px] rounded-full bg-white p-1 flex items-center justify-center overflow-hidden shadow-xs">
            <img
              src="/images/house-of-loom-craft-icon.png"
              alt="House of Loom & Craft Concierge"
              className="w-full h-full object-contain"
              loading="eager"
            />
          </div>

          {/* Small Green Online Status Indicator */}
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#52B75E] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#52B75E] border-2 border-[#34402D]"></span>
          </span>
        </motion.button>
      </div>

      {/* Floating Chat Window Modal: Dedicated Mobile Bottom-Sheet / Compact 390px Desktop */}
      <AnimatePresence>
        {isOpen && (
          <motion.section
            aria-label="House of Loom & Craft Concierge Chat"
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-2 left-2 right-2 sm:left-auto sm:right-6 sm:bottom-[88px] w-[calc(100vw-16px)] sm:w-[min(390px,calc(100vw-32px))] max-w-none sm:max-w-[390px] h-[min(680px,calc(100vh-96px))] sm:h-[min(590px,calc(100vh-110px))] max-h-[calc(100vh-96px)] sm:max-h-[calc(100vh-110px)] [@supports(height:100dvh)]:h-[min(680px,calc(100dvh-96px))] [@supports(height:100dvh)]:max-h-[calc(100dvh-96px)] sm:[@supports(height:100dvh)]:h-[min(590px,calc(100vh-110px))] sm:[@supports(height:100dvh)]:max-h-[calc(100vh-110px)] bg-[#FAF7F2] border border-[#DDD5C7] rounded-[22px] sm:rounded-[26px] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.32),0_0_0_1px_rgba(52,64,45,0.12)] flex flex-col overflow-hidden z-50"
          >
            {/* Window Header: 70px Mobile / 76px Desktop (flex-shrink: 0, Always Visible) */}
            <header className="h-[70px] min-h-[70px] sm:h-[76px] sm:min-h-[76px] px-3 sm:px-5 bg-[#34402D] text-[#FAF7F0] flex items-center justify-between border-b border-[#283222] shadow-sm select-none flex-shrink-0 sticky top-0 z-20">
              {/* Left: Brand Icon + Title + AI Subtitle */}
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white p-1 flex-shrink-0 flex items-center justify-center shadow-xs border border-white/20 overflow-hidden">
                  <img
                    src="/images/house-of-loom-craft-icon.png"
                    alt="House of Loom & Craft"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif text-[14.5px] sm:text-[16px] text-[#FAF7F0] font-medium tracking-wide truncate leading-tight">
                    House of Loom & Craft
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1B6BC7] shadow-[0_0_6px_#1B6BC7]"></span>
                    <span className="text-[10px] sm:text-[11px] font-sans text-[#DCD1BF] tracking-wider uppercase font-semibold">
                      AI Concierge
                    </span>
                    <span className="text-[#88A279] text-[9px] select-none">•</span>
                    <span className="text-[9px] text-[#86EFAC] font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#52B75E] inline-block animate-pulse"></span>
                      Online
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Close Button */}
              <button
                onClick={handleClose}
                aria-label="Close Chat Window"
                className="p-1.5 sm:p-2 text-[#FAF7F0]/80 hover:text-[#FAF7F0] hover:bg-white/10 rounded-full transition-colors cursor-pointer flex-shrink-0 ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Conversation Stream: Warm Ivory Background (ONLY Vertically Scrollable Area, min-height: 0) */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-3 sm:py-3.5 space-y-3 sm:space-y-3.5 bg-[#FAF7F2] relative scroll-smooth overscroll-contain">
              {/* Subtle Botanical Watermark Accent */}
              <div className="absolute inset-y-0 left-0 w-20 pointer-events-none opacity-[0.05] overflow-hidden select-none">
                <svg viewBox="0 0 100 300" className="w-full h-full text-[#34402D]" fill="currentColor">
                  <path d="M10,20 C30,40 50,20 60,60 C40,70 20,50 10,80 C30,100 50,90 60,130 C40,140 20,120 10,150 C30,170 50,160 60,200 C40,210 20,190 10,220 C30,240 50,230 60,270" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </div>

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start'} relative z-10`}
                >
                  {/* Assistant Avatar Badge: Icon Only (38-42px) */}
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-xs border border-[#DDD5C7] p-1 flex items-center justify-center flex-shrink-0 mr-2 sm:mr-2.5 self-start mt-0.5">
                      <img
                        src="/images/house-of-loom-craft-icon.png"
                        alt="AI Concierge Avatar"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {/* Message Bubble: Compact & Comfortable */}
                  <div
                    className={`max-w-[85%] rounded-[18px] px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-xs transition-all ${
                      msg.role === 'user'
                        ? 'bg-[#34402D] text-[#FAF7F0] rounded-tr-[4px]'
                        : 'bg-[#F2ECE1] border border-[#E2DDD3] text-[#241C16] rounded-tl-[4px]'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="text-[13px] sm:text-[13.5px] leading-relaxed font-sans whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    ) : (
                      <div>
                        {idx === 0 ? (
                          <div className="font-sans">
                            <h4 className="font-serif text-[18px] font-semibold text-[#1E1914] mb-1">
                              👋 Hello
                            </h4>
                            <p className="text-[14px] font-semibold text-[#241C16] mb-1.5">
                              Welcome to House of Loom & Craft.
                            </p>
                            <p className="text-[14px] leading-[1.5] text-[#3B3228]">
                              I’m your AI Concierge. I can help you explore our handcrafted rugs and home decor, find the right piece for your space, and assist with orders and offers.
                            </p>
                            <p className="text-[13px] leading-[1.5] text-[#635546] mt-1.5 font-serif italic">
                              How may I help you today?
                            </p>
                          </div>
                        ) : (
                          <SafeFormattedMessage text={msg.content} />
                        )}
                      </div>
                    )}

                    {/* Timestamp bottom right */}
                    <div
                      className={`text-[9.5px] mt-1 font-sans ${
                        msg.role === 'user' ? 'text-[#FAF7F0]/60 text-right' : 'text-[#8C7D70] text-right'
                      }`}
                    >
                      {msg.timestamp || '2:43 PM'}
                    </div>
                  </div>

                  {/* Embedded Mini Product Recommendations */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-2 w-full space-y-1.5">
                      <div className="text-[10px] font-sans uppercase tracking-wider text-[#34402D] font-bold px-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1B6BC7]"></span>
                        Curated Atelier Pieces
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {msg.products.map((prod) => (
                          <div
                            key={prod.id || prod.slug}
                            className="flex items-center gap-2 p-2 bg-white rounded-xl border border-[#DDD5C7] shadow-xs hover:shadow-sm transition-shadow group"
                          >
                            {prod.thumbnail ? (
                              <img
                                src={prod.thumbnail}
                                alt={prod.name}
                                className="w-11 h-11 object-cover rounded-lg border border-[#DDD5C7]/70 bg-[#F5F0E6] flex-shrink-0"
                              />
                            ) : (
                              <div className="w-11 h-11 bg-[#F5F0E6] rounded-lg border border-[#DDD5C7]/70 flex items-center justify-center text-[#34402D]/40 flex-shrink-0">
                                <Package className="w-4 h-4" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <h4 className="text-[11.5px] font-serif font-medium text-[#241C16] truncate group-hover:text-[#34402D] transition-colors">
                                {prod.name}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[11.5px] font-semibold text-[#18120D]">
                                  ₹{prod.price?.toLocaleString('en-IN')}
                                </span>
                                {prod.badge && (
                                  <span className="text-[8px] px-1 py-0.2 bg-[#1B6BC7]/10 text-[#1B6BC7] rounded-full uppercase tracking-wider font-semibold border border-[#1B6BC7]/20">
                                    {prod.badge}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setIsOpen(false);
                                navigate(`/products/${prod.slug}`);
                              }}
                              className="px-2 py-1 bg-[#34402D]/10 hover:bg-[#34402D] text-[#34402D] hover:text-[#FAF7F0] rounded-lg text-[10.5px] font-sans font-medium transition-colors flex items-center gap-0.5 flex-shrink-0 cursor-pointer"
                              aria-label={`View details for ${prod.name}`}
                            >
                              <span>View</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white shadow-xs border border-[#DDD5C7] p-1 flex items-center justify-center flex-shrink-0">
                    <img
                      src="/images/house-of-loom-craft-icon.png"
                      alt="House of Loom & Craft AI"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="bg-[#F2ECE1] border border-[#E2DDD3] px-3.5 py-2 rounded-[18px] rounded-tl-[4px] shadow-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34402D] animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34402D] animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34402D] animate-bounce"></span>
                    <span className="text-[11px] text-[#8C7D70] ml-2 font-sans">Connecting with atelier records...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Pill Buttons: Responsive Wrap, flex-shrink: 0 */}
            {messages.length <= 3 && !isLoading && (
              <div className="px-2.5 sm:px-3.5 py-2 bg-[#FAF7F2] border-t border-[#DDD5C7]/70 flex-shrink-0">
                <div className="flex flex-wrap gap-[6px]">
                  {quickActions.map((qa, i) => {
                    const IconComp = qa.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(qa.prompt)}
                        className="px-[10px] py-[6px] sm:py-[7px] min-h-[32px] sm:min-h-[34px] rounded-full bg-white hover:bg-[#F0EBE1] text-[#2C231B] border border-[#D5CDBC] hover:border-[#34402D] transition-colors text-[12px] sm:text-[12.5px] font-sans font-medium flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
                      >
                        <IconComp className="w-3.5 h-3.5 text-[#34402D] flex-shrink-0" />
                        <span>{qa.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input Composer Field: 54-58px Compact Container with Safe Area Support, flex-shrink: 0 */}
            <div 
              className="px-2.5 sm:px-3 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] bg-[#FAF7F2] border-t border-[#DDD5C7]/80 flex-shrink-0"
              style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))' }}
            >
              <div className="h-[44px] sm:h-[46px] min-h-[44px] flex items-center gap-2 bg-white rounded-full border border-[#DDD5C7] px-2.5 sm:px-3 shadow-xs focus-within:border-[#34402D] focus-within:ring-2 focus-within:ring-[#1B6BC7]/15 transition-all">
                {/* Paperclip / Floor Plan Inquiry Button */}
                <button
                  type="button"
                  title="Attach design or floor plan"
                  onClick={() => handleSendMessage("I'd like to share an architectural floor plan for custom rug recommendation.")}
                  className="text-[#8C7D70] hover:text-[#34402D] transition-colors p-1.5 cursor-pointer flex-shrink-0"
                  aria-label="Attach floor plan or image inquiry"
                >
                  <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                {/* Text input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  maxLength={500}
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-[13px] text-[#241C16] placeholder-[#8C7D70] focus:outline-none font-sans min-w-0"
                  aria-label="Type your message for House of Loom & Craft Concierge"
                />

                {/* Send Button */}
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  aria-label="Send Message"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#34402D] hover:bg-[#263121] disabled:opacity-30 text-[#FAF7F0] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5 -ml-0.5" />
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
