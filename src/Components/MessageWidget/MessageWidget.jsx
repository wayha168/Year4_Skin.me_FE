// MessageWidget.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaSmile, FaPaperPlane, FaTimes, FaSpinner } from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import { usePathname } from "next/navigation";
import axiosAuth from "../../app/lib/api/axiosConfig";
import useAuthContext from "../../app/lib/Authentication/AuthContext";

const WELCOME_MESSAGE =
  "Hello! This is Skin.me Assistant – your personal skincare advisor. How can I help you today?";

const FALLBACK_ANSWER =
  "I couldn't find an exact product for that, but I can still help you with skincare advice or product suggestions!";

const MessageWidget = () => {
  const pathname = usePathname();
  const [showInput, setShowInput] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const messagesEndRef = useRef(null);

  // Check if on login or signup page
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  // Conditional class for mobile bottom margin
  const mobileMarginClass = isAuthPage ? "" : "max-[770px]:mb-[4.7rem]";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (showInput && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          text: WELCOME_MESSAGE,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [showInput, messages.length]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg = {
      role: "user",
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axiosAuth.post("/chat/assistant", trimmed, {
        headers: { "Content-Type": "text/plain" },
        timeout: 30_000,
      });

      let aiText = (res.data || "").trim();
      if (!aiText) aiText = FALLBACK_ANSWER;

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      aiText = aiText.replace(/src="(\/api\/v1\/images[^"]*)"/g, `src="${origin}$1"`);

      const assistantMsg = {
        role: "assistant",
        text: aiText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      const errMsg = {
        role: "assistant",
        text: FALLBACK_ANSWER,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  // Floating Button
  if (!showInput) {
    return (
      <div
        className={`fixed bottom-5 right-5 w-[4.5rem] h-[4.5rem] bg-gradient-to-br from-pink-400 to-purple-600 text-white rounded-full flex items-center justify-center text-2xl shadow-[0_6px_20px_rgba(0,0,0,0.25)] cursor-pointer z-[999] transition-all duration-200 hover:scale-110 active:scale-105 active:bg-gradient-to-br active:from-pink-300 active:to-purple-500 ${mobileMarginClass}`}
        onClick={() => setShowInput(true)}
      >
        <i className="fa-solid fa-message text-white text-2xl" />
      </div>
    );
  }

  // Message Box
  return (
    <div className={`fixed bottom-5 right-5 w-[380px] max-h-[80vh] bg-white rounded-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.15)] flex flex-col font-[Segoe_UI,Roboto,sans-serif] z-[1000] overflow-hidden transition-all duration-300 ${mobileMarginClass}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-br from-pink-400 to-purple-600 text-white font-semibold text-base shadow-[0_4px_10px_rgba(0,0,0,0.1)]">
        <span className="flex items-center gap-2">
          <span className="w-[34px] h-[34px] bg-white text-purple-600 font-bold text-lg rounded-full flex items-center justify-center">
            S
          </span>
          Skin.me Assistant
        </span>
        <button
          onClick={() => setShowInput(false)}
          className="bg-transparent border-none text-white text-lg cursor-pointer p-1 transition-colors duration-200 hover:text-pink-200"
        >
          <FaTimes />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 p-3 overflow-y-auto bg-[#f6f5fa] flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 max-w-[85%] animate-[fadeIn_0.3s_ease] transition-transform duration-200 hover: ${
              msg.role === "user"
                ? "self-end flex-row-reverse origin-bottom-right"
                : "self-start origin-bottom-left"
            }`}
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              {msg.role === "user" ? (
                <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-base shadow-[0_2px_6px_rgba(0,0,0,0.1)] bg-pink-400 text-white">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
              ) : (
                <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-lg shadow-[0_2px_6px_rgba(0,0,0,0.1)] bg-purple-600 text-white">
                  S
                </div>
              )}
            </div>

            {/* Bubble Content */}
            <div
              className={`px-4 py-3 rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.08)] max-w-full break-words ${
                msg.role === "user" ? "bg-pink-400 text-white" : "bg-white"
              }`}
            >
              <p
                className="m-0 text-[15px] leading-relaxed break-words"
                dangerouslySetInnerHTML={{ __html: msg.text }}
              />
              <small
                className={`block mt-1 text-[11px] opacity-70 text-right ${
                  msg.role === "user" ? "text-pink-100" : ""
                }`}
              >
                {msg.time}
              </small>
            </div>
          </div>
        ))}

        {/* Loading State */}
        {loading && (
          <div className="flex gap-2.5 max-w-[85%] animate-[fadeIn_0.3s_ease] self-start origin-bottom-left">
            <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-lg shadow-[0_2px_6px_rgba(0,0,0,0.1)] bg-purple-600 text-white">
              S
            </div>
            <div className="bg-transparent shadow-none flex items-center gap-2 text-gray-600">
              <FaSpinner className="animate-spin" />
              <span>Answer…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex items-center p-3 bg-white border-t border-gray-200 gap-2 relative">
        {/* Emoji Button */}
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className="bg-transparent border-none text-xl cursor-pointer text-purple-600 disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <FaSmile />
        </button>

        {/* Emoji Picker */}
        {showEmoji && (
          <div className="absolute bottom-[60px] left-2.5 z-10 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
            <EmojiPicker onEmojiClick={handleEmojiClick} height={350} width={300} />
          </div>
        )}

        {/* Input Field */}
        <input
          type="text"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-3xl text-sm outline-none transition-all duration-200 focus:border-purple-600 focus:shadow-[0_0_8px_rgba(108,92,231,0.3)]"
          placeholder="Ask about products..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading}
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          className="bg-transparent border-none text-xl cursor-pointer text-purple-600 disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={loading || !input.trim()}
        >
          {loading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
        </button>
      </div>

      {/* Add custom animations to your tailwind.config.js or global CSS */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default MessageWidget;