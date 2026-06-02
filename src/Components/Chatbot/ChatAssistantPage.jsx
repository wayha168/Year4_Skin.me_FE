"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import useAuthContext from "../../app/lib/Authentication/AuthContext";
import { FaArrowUp, FaEdit, FaImage, FaPaperclip, FaPlus, FaSpinner, FaTrashAlt } from "react-icons/fa";
import { FaWandSparkles } from "react-icons/fa6";
import { CHATBOT_API_BASE } from "../../app/lib/api/config";

const WELCOME_MESSAGE =
  "Hello! I’m Skin.me Assistant. I can help with skincare questions, product guidance, and skin image analysis.";

const ERROR_MESSAGE = "Sorry, I couldn't respond just now. Please try again in a moment and I’ll help you.";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeUrl(url = "") {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return url.startsWith("/") ? url : `/${url}`;
}

function findImageUrlsInText(text = "") {
  // Don't extract product URLs as images
  const productUrlPattern = /https?:\/\/skinme\.store\/product_details\?productId=\d+/gi;
  const productUrls = text.match(productUrlPattern) || [];
  
  const directMatches = text.match(/https?:\/\/[^\s<>"']+\.(?:png|jpg|jpeg|gif|webp|bmp|svg)/gi) || [];
  const htmlMatches = [...text.matchAll(/src=["']([^"']+)["']/gi)].map((match) => match[1]);
  
  // Markdown images but exclude product URLs
  const markdownMatches = [...text.matchAll(/!\[[^\]]*\]\(([^)]+)\)/gi)]
    .map((match) => match[1])
    .filter(url => !productUrls.includes(url));
  
  return [...new Set([...directMatches, ...htmlMatches, ...markdownMatches].map(normalizeUrl))];
}

function stripImageMarkup(text = "") {
  return text
    .replace(/<img[^>]*>/gi, "")
    .replace(/!\[[^\]]*]\(([^)]+)\)/gi, "")
    .trim();
}

function formatAssistantHtml(text) {
  let escaped = escapeHtml(text);

  // Process lines with product URLs followed by product name and price
  // Format: "https://skinme.store/product_details?productId=17 — Product Name — Price"
  const lines = escaped.split("\n");
  const processedLines = lines.map((line) => {
    // Match: product URL followed by em-dash/dash and product info
    const match = line.match(/(https?:\/\/skinme\.store\/product_details\?productId=(\d+))\s*[—-]\s*(.+)$/i);
    if (match) {
      const fullUrl = match[1];
      const productId = match[2];
      const productInfo = match[3].trim();
      return `<div class="border-b border-[#f0d7e3] py-2 last:border-0"><a href="/product_details?productId=${productId}" class="block font-semibold text-[#1f2937] hover:text-[#b5487f]">${productInfo}</a></div>`;
    }
    return line;
  });
  
  // Convert other markdown links [text](url) to HTML anchors
  let result = processedLines.join("\n").replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer" class="text-[#b5487f] underline break-all">$1</a>'
  );

  // Convert other plain URLs to clickable links (non-product URLs)
  result = result.replace(
    /(https?:\/\/(?!skinme\.store\/product_details)[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noreferrer" class="text-[#b5487f] underline break-all">$1</a>'
  );

  return result.replace(/\n/g, "<br />");
}

function extractImages(payload) {
  if (!payload || typeof payload !== "object") return [];

  const imageCandidates = [
    payload.image,
    payload.imageUrl,
    payload.image_url,
    payload.qrImage,
    payload.data?.image,
    payload.data?.imageUrl,
    payload.data?.image_url,
  ];

  const arrayCandidates = [
    payload.images,
    payload.imageUrls,
    payload.image_urls,
    payload.data?.images,
    payload.data?.imageUrls,
    payload.data?.image_urls,
  ];

  const resolved = [];

  imageCandidates.forEach((value) => {
    if (typeof value === "string" && value.trim()) resolved.push(normalizeUrl(value.trim()));
  });

  arrayCandidates.forEach((value) => {
    if (!Array.isArray(value)) return;
    value.forEach((item) => {
      if (typeof item === "string" && item.trim()) {
        resolved.push(normalizeUrl(item.trim()));
      } else if (item && typeof item === "object") {
        const nestedUrl = item.url ?? item.image ?? item.imageUrl ?? item.src;
        if (typeof nestedUrl === "string" && nestedUrl.trim()) {
          resolved.push(normalizeUrl(nestedUrl.trim()));
        }
      }
    });
  });

  return [...new Set(resolved)];
}

function extractReply(payload) {
  // API returns: { reply, options, session_id, admin_connected }
  if (typeof payload === "string") {
    return {
      text: stripImageMarkup(payload.trim()),
      images: [],
      productIds: [],
      options: [],
    };
  }

  if (!payload || typeof payload !== "object") {
    return { text: "", images: [], productIds: [], options: [] };
  }

  let rawText = payload.reply || payload.message || payload.answer || payload.response || "";

  if (typeof rawText !== "string") {
    rawText = "";
  }

  const text = stripImageMarkup(rawText.trim());
  
  // Extract productIds and match them with images if available from API
  const productIds = payload.productIds && Array.isArray(payload.productIds) 
    ? payload.productIds 
    : [...rawText.matchAll(/productId=(\d+)/gi)].map(m => m[1]);
  
  // Extract images - check payload for image fields that might have product context
  let images = [...new Set([...extractImages(payload), ...findImageUrlsInText(rawText)])];
  
  const options = Array.isArray(payload.options) ? payload.options : [];

  return { text, images, productIds, options };
}

export default function ChatAssistantPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirect=/chatbot");
    }
  }, [user, authLoading, router]);

  const composerInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const endRef = useRef(null);

  // Chat state - stored in memory only (no localStorage)
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const currentChat = chats.find((c) => c.id === currentChatId);
  const messages = currentChat?.messages || [];

  // Load chat history from localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !user?.id) return;
    
    const storageKey = `chatHistory_${user.id}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsedHistory = JSON.parse(stored);
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          setChats(parsedHistory);
          if (!currentChatId) {
            setCurrentChatId(parsedHistory[0].id);
          }
          setHistoryLoaded(true);
          return;
        }
      } catch (e) {
        console.error("Failed to parse chat history:", e);
      }
    }
    setHistoryLoaded(true);
  }, [user?.id]);

  // Initialize with welcome chat only if no history exists
  useEffect(() => {
    if (historyLoaded && (!user?.id || chats.length === 0)) return;
    if (chats.length > 0) return;
    
    const welcomeChat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [
        {
          id: "welcome",
          role: "assistant",
          text: WELCOME_MESSAGE,
          html: formatAssistantHtml(WELCOME_MESSAGE),
          images: [],
          productIds: [],
          options: [],
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ],
    };
    setChats([welcomeChat]);
    setCurrentChatId(welcomeChat.id);
  }, [historyLoaded, user?.id, chats.length]);

  // Create new chat (ChatGPT style - save previous first)
  const createNewChat = async () => {
    if (currentChat) {
      await saveChatToBackend(currentChat);
    }

    const newChat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [
        {
          id: "welcome",
          role: "assistant",
          text: WELCOME_MESSAGE,
          html: formatAssistantHtml(WELCOME_MESSAGE),
          images: [],
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ],
    };

    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setInput("");
    setSelectedImage(null);
  };

  // Switch to existing chat
  const switchChat = async (chatId) => {
    if (currentChatId !== chatId && currentChat) {
      await saveChatToBackend(currentChat);
    }
    setCurrentChatId(chatId);
    setInput("");
    setSelectedImage(null);
  };

  // Delete a chat
  const deleteChat = (chatId) => {
    if (chats.length === 1) return; // Don't delete the last chat

    const newChats = chats.filter((c) => c.id !== chatId);
    setChats(newChats);

    if (currentChatId === chatId) {
      setCurrentChatId(newChats[0].id);
    }
  };

  // === Rename Chat (ChatGPT style) ===
  const startRenaming = (chat) => {
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const saveRename = async () => {
    if (!editingChatId) return;

    const newTitle = editingTitle.trim() || "Untitled Chat";

    setChats((prev) => prev.map((chat) => (chat.id === editingChatId ? { ...chat, title: newTitle } : chat)));

    // Save the whole conversation with the updated title
    const chatToUpdate = chats.find((c) => c.id === editingChatId);
    if (chatToUpdate) {
      await saveChatToBackend({
        ...chatToUpdate,
        title: newTitle,
      });
    }

    setEditingChatId(null);
    setEditingTitle("");
  };

  const cancelRename = () => {
    setEditingChatId(null);
    setEditingTitle("");
  };

  // Save entire conversation to localStorage (chat history)
  const saveChatToBackend = async (chatToSave) => {
    if (!user?.id || !chatToSave) return;

    // Only save chats that have real user interaction
    const hasUserMessage = chatToSave.messages.some((m) => m.role === "user");
    if (!hasUserMessage) return;

    try {
      // SSR safety check
      if (typeof window === "undefined") return;

      // Save to localStorage for persistence
      const storageKey = `chatHistory_${user.id}`;
      const stored = localStorage.getItem(storageKey);
      const chats = stored ? JSON.parse(stored) : [];

      // Update or add the chat
      const existingIndex = chats.findIndex((c) => c.id === chatToSave.id);
      if (existingIndex >= 0) {
        chats[existingIndex] = chatToSave;
      } else {
        chats.push(chatToSave);
      }

      localStorage.setItem(storageKey, JSON.stringify(chats));

      // Optional: Log to chatbot service (completely non-blocking)
      // Note: Logging endpoint spec not provided, so we skip if it fails
      // If you want to enable this, provide the exact API contract
      // await axios.post(
      //   `${CHATBOT_API_BASE}/v1/chat/log`,
      //   {
      //     user_id: Number(user.id) || user.id,
      //     session_id: chatToSave.id,
      //     title: chatToSave.title || "Untitled Chat",
      //     message_count: chatToSave.messages.length,
      //     timestamp: new Date().toISOString(),
      //   },
      //   {
      //     headers: { "Content-Type": "application/json" },
      //     timeout: 5000,
      //   }
      // );
    } catch (err) {
      console.error("Failed to save chat to localStorage:", err);
    }
  };

  const selectedImagePreview = useMemo(
    () => (selectedImage ? URL.createObjectURL(selectedImage) : null),
    [selectedImage],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, selectedImagePreview]);

  // Save current chat when leaving the page (whole conversation at once)
  useEffect(() => {
    return () => {
      if (currentChat && user?.id) {
        saveChatToBackend(currentChat);
      }
    };
  }, [currentChat, user]);

  const clearSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      alert("Image is too large. Please choose one under 10MB.");
      event.target.value = "";
      return;
    }

    setSelectedImage(file);
  };

  // Chatbot API expects payload like:
  // {
  //   message: string,
  //   history?: [{ role: string, content: string }],
  //   use_llm?: boolean,
  //   use_database?: boolean,
  //   session_id?: string,
  //   user_id?: string,
  //   user_email?: string,
  //   user_name?: string
  // }
  const sendText = async (message) => {
    if (!message?.trim()) {
      throw new Error("Message cannot be empty");
    }

    const trimmedMessage = message.trim();

    const body = {
      message: trimmedMessage,
    };

    if (currentChatId) body.session_id = currentChatId;
    if (user?.id) body.user_id = String(user.id);
    if (user?.email) body.user_email = user.email;

    const userName =
      (user?.firstName && user?.lastName && `${user.firstName} ${user?.lastName}`) ||
      user?.name ||
      user?.email ||
      "";
    if (userName) body.user_name = userName;

    // Build history from current chat messages (excluding welcome message)
    const history = messages
      .filter((m) => m.role !== "assistant" || m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.text }));
    if (history.length > 0) body.history = history;


    const response = await axios.post(`${CHATBOT_API_BASE}/v1/chat`, body, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });

    return extractReply(response.data);
  };

  const sendImage = async (message, imageFile) => {
    if (!message?.trim()) {
      throw new Error("Message cannot be empty");
    }
    if (!imageFile) {
      throw new Error("Image file is required");
    }

    const formData = new FormData();
    formData.append("message", message.trim());
    if (currentChatId) formData.append("session_id", currentChatId);
    if (user?.id) formData.append("user_id", String(user.id));
    if (user?.email) formData.append("user_email", user.email);
    if (user?.firstName && user?.lastName) {
      formData.append("user_name", `${user.firstName} ${user.lastName}`);
    } else if (user?.name) {
      formData.append("user_name", user.name);
    } else if (user?.email) {
      formData.append("user_name", user.email);
    }
    formData.append("image", imageFile);


    const response = await axios.post(`${CHATBOT_API_BASE}/v1/chat/with-image`, formData, {
      timeout: 45000,
    });

    return extractReply(response.data);
  };

  const handleSend = async (presetText) => {
    const trimmed = (presetText ?? input).trim();
    if ((!trimmed && !selectedImage) || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed || "Please analyze this image.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      localImage: selectedImagePreview,
    };

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              title: chat.title === "New Chat" ? trimmed.slice(0, 30) : chat.title,
              messages: [...chat.messages, userMessage],
            }
          : chat,
      ),
    );

    setInput("");
    setLoading(true);

    const imageToSend = selectedImage;
    clearSelectedImage();

    try {
      const result = imageToSend
        ? await sendImage(trimmed || "Please analyze this skin image.", imageToSend)
        : await sendText(trimmed);

      const responseText = result.text || ERROR_MESSAGE;

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: responseText,
        html: formatAssistantHtml(responseText),
        images: result.images || [],
        productIds: result.productIds || [],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === currentChatId ? { ...chat, messages: [...chat.messages, assistantMessage] } : chat,
        ),
      );
    } catch (error) {
      console.error("Chat assistant error:", error);

      if (error?.response?.data) {
        console.error("❌ API Response:", error.response.data);
      }

      const rawError =
        error?.response?.data?.message || error?.response?.data?.detail || error?.message || "";
      const rawErrorStr = Array.isArray(rawError)
        ? rawError.map((e) => (typeof e === "string" ? e : e?.msg || JSON.stringify(e))).join(", ")
        : typeof rawError === "string"
          ? rawError
          : "";
      let displayError = rawErrorStr || ERROR_MESSAGE;

      if (
        rawErrorStr.toLowerCase().includes("does not support image") ||
        rawErrorStr.toLowerCase().includes("image input")
      ) {
        displayError =
          "Sorry, the current AI model doesn't support image analysis right now. Please try asking a text question instead.";
      }

      const errorMessage = {
        id: `assistant-error-${Date.now()}`,
        role: "assistant",
        text: displayError,
        html: formatAssistantHtml(displayError),
        images: [],
        productIds: [],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === currentChatId ? { ...chat, messages: [...chat.messages, errorMessage] } : chat,
        ),
      );
    } finally {
      setLoading(false);
      composerInputRef.current?.focus();
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,#fff8fb_0%,#fff4ef_45%,#f8f5f7_100%)] lg:flex-row">
      <aside className="min-h-0 shrink-0 overflow-y-auto overscroll-contain border-b border-[#f1d9e5] bg-[linear-gradient(180deg,#fff6fa_0%,#fffaf7_100%)] px-5 py-4 lg:flex lg:w-[280px] lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r lg:py-6 max-lg:max-h-[min(32dvh,280px)]">
        <div className="rounded-[28px] border border-[#f0d7e3] bg-white/85 p-5 shadow-[0_16px_32px_rgba(83,33,58,0.06)] backdrop-blur">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#eb61a2_0%,#ff9f6e_100%)] text-white shadow-[0_10px_20px_rgba(235,97,162,0.2)]">
              <FaWandSparkles />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b5487f]">Skin.me</p>
              <h1 className="text-lg font-bold text-[#1f2937]">AI Assistant</h1>
            </div>
          </div>

          <p className="text-sm leading-6 text-[#5b6473]">
            Ask skincare questions, upload a skin image, and get a clearer answer in a friendly chat space.
          </p>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={createNewChat}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1f2937] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#111827]"
            >
              <FaPlus />
              New conversation
            </button>
          </div>
        </div>

        {/* Chat History */}
        <div className="mt-5 rounded-[28px] border border-[#f0d7e3] bg-white/85 p-5 shadow-[0_16px_32px_rgba(83,33,58,0.06)] backdrop-blur flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#1f2937]">Chat History</p>
            <button
              onClick={createNewChat}
              className="text-xs px-3 py-1 rounded-full bg-[#eb61a2] text-white hover:bg-[#d94d8c] transition"
            >
              + New
            </button>
          </div>

          <div className="space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  if (editingChatId !== chat.id) switchChat(chat.id);
                }}
                onDoubleClick={() => startRenaming(chat)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition ${
                  currentChatId === chat.id ? "bg-[#fff2f8] border border-[#eb61a2]" : "hover:bg-[#fff8fb]"
                }`}
              >
                <div className="flex-1 min-w-0">
                  {editingChatId === chat.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={saveRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename();
                        if (e.key === "Escape") cancelRename();
                      }}
                      autoFocus
                      className="w-full text-sm font-medium bg-white border border-[#eb61a2] rounded px-2 py-1 focus:outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p className="text-sm font-medium text-[#1f2937] truncate">{chat.title}</p>
                  )}
                  <p className="text-[11px] text-[#6b7280]">{chat.messages.length} messages</p>
                </div>

                <div className="flex items-center gap-1">
                  {/* Pencil icon for rename on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startRenaming(chat);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-[#eb61a2] p-1 transition"
                    title="Rename chat"
                  >
                    <FaEdit className="text-xs" />
                  </button>

                  {chats.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 p-1"
                      title="Delete chat"
                    >
                      <FaTrashAlt className="text-xs" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-[#f0d7e3] bg-white/80 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#1f2937]">Skin.me Chat</h2>
              <p className="text-sm text-[#6b7280]">
                Professional skincare guidance with friendly, human-sounding replies.
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-5xl flex-col gap-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-3xl rounded-[28px] border px-5 py-4 shadow-[0_14px_32px_rgba(48,20,39,0.07)] ${
                    message.role === "user"
                      ? "border-[#eb61a2] bg-[linear-gradient(135deg,#eb61a2_0%,#f37fb3_100%)] text-white"
                      : "border-[#f0d7e3] bg-white text-[#1f2937]"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-bold ${
                        message.role === "user" ? "bg-white/20 text-white" : "bg-[#fff1f6] text-[#c03f82]"
                      }`}
                    >
                      {message.role === "user" ? "You" : "AI"}
                    </div>
                    <span
                      className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                        message.role === "user" ? "text-white/75" : "text-[#b5487f]"
                      }`}
                    >
                      {message.role === "user" ? "Customer" : "Assistant"}
                    </span>
                  </div>

                  {message.localImage && (
                    <a href={message.localImage} target="_blank" rel="noreferrer">
                      <img
                        src={message.localImage}
                        alt="Uploaded preview"
                        className="mb-4 max-h-[340px] w-full rounded-3xl object-cover"
                      />
                    </a>
                  )}

                  <div
                    className={`text-sm leading-7 ${message.role === "user" ? "text-white" : "text-[#334155]"}`}
                    dangerouslySetInnerHTML={{
                      __html: message.role === "assistant" ? message.html : formatAssistantHtml(message.text),
                    }}
                  />

{Array.isArray(message.images) && message.images.length > 0 && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {message.images.map((imageUrl, idx) => {
                          // Extract ALL productIds from text and match by index
                          const allProductIds = message.text ? [...message.text.matchAll(/productId=(\d+)/gi)].map(m => m[1]) : [];
                          const productId = allProductIds[idx];
                          return (
                            <a
                              key={imageUrl}
                              href={productId ? `/product_details?productId=${productId}` : imageUrl}
                              target={productId ? undefined : "_blank"}
                              rel={productId ? undefined : "noreferrer"}
                              className="group overflow-hidden rounded-3xl border border-[#f0d7e3] bg-[#fff8fb]"
                            >
                              <img
                                src={imageUrl}
                                alt="Product"
                                className="h-52 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                              />
                              <div className="border-t border-[#f0d7e3] px-4 py-3 text-xs font-medium text-[#b5487f]">
                                {productId ? "View Product" : "Open image"}
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    )}

                  <div
                    className={`mt-3 text-right text-[11px] ${
                      message.role === "user" ? "text-white/75" : "text-[#94a3b8]"
                    }`}
                  >
                    {message.time}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-xl rounded-[28px] border border-[#f0d7e3] bg-white px-5 py-4 shadow-[0_14px_32px_rgba(48,20,39,0.07)]">
                  <div className="flex items-center gap-3 text-sm text-[#64748b]">
                    <FaSpinner className="animate-spin text-[#eb61a2]" />
                    Skin.me Assistant is preparing a helpful reply...
                  </div>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>
        </div>

        <div className="shrink-0 border-t border-[#f0d7e3] bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto max-w-5xl">
            {selectedImagePreview && (
              <div className="mb-4 rounded-[28px] border border-[#f0d7e3] bg-[#fff8fb] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#7c3a57]">
                    <FaPaperclip />
                    Image ready to send
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedImage}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-[#b5487f] transition hover:bg-[#fff0f7]"
                  >
                    <FaTrashAlt />
                    Remove
                  </button>
                </div>
                <img
                  src={selectedImagePreview}
                  alt="Selected upload"
                  className="max-h-44 rounded-3xl object-cover"
                />
              </div>
            )}

            <div className="rounded-[30px] border border-[#ecd7e2] bg-white p-3 shadow-[0_16px_40px_rgba(60,15,40,0.08)]">
              <div className="flex items-end gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff1f6] text-[#c03f82] transition hover:bg-[#ffe6f1]"
                  aria-label="Upload skin image"
                >
                  <FaImage />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />

                <textarea
                  ref={composerInputRef}
                  rows={1}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={
                    selectedImage ? "Add a note for this skin image..." : "Message Skin.me Assistant..."
                  }
                  className="max-h-40 min-h-[48px] flex-1 resize-none bg-transparent px-2 py-3 text-sm text-[#1f2937] outline-none placeholder:text-[#94a3b8]"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={loading || (!input.trim() && !selectedImage)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#eb61a2_0%,#ff9f6e_100%)] text-white shadow-[0_16px_24px_rgba(235,97,162,0.28)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send message"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : <FaArrowUp />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
