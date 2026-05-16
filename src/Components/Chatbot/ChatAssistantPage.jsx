"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  FaArrowUp,
  FaImage,
  FaPaperclip,
  FaPlus,
  FaSpinner,
  FaTrashAlt,
} from "react-icons/fa";
import { FaWandSparkles } from "react-icons/fa6";
import { CHATBOT_API_BASE } from "../../app/lib/api/config";

const QUICK_PROMPTS = [
  "Suggest a skincare routine for sensitive skin.",
  "What ingredients help with acne and dark spots?",
  "Please analyze my skin image and explain what you see.",
  "Recommend products for dry skin and redness.",
];

const WELCOME_MESSAGE =
  "Hello! I’m Skin.me Assistant. I can help with skincare questions, product guidance, and skin image analysis.";

const ERROR_MESSAGE =
  "Sorry, I couldn't respond just now. Please try again in a moment and I’ll help you.";

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
  const normalizedBase = CHATBOT_API_BASE.replace(/\/+$/, "");
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${normalizedBase}${normalizedPath}`;
}

function findImageUrlsInText(text = "") {
  const directMatches = text.match(/https?:\/\/[^\s<>"']+\.(?:png|jpg|jpeg|gif|webp|bmp|svg)/gi) || [];
  const htmlMatches = [...text.matchAll(/src=["']([^"']+)["']/gi)].map((match) => match[1]);
  const markdownMatches = [...text.matchAll(/!\[[^\]]*]\(([^)]+)\)/gi)].map((match) => match[1]);

  return [...new Set([...directMatches, ...htmlMatches, ...markdownMatches].map(normalizeUrl))];
}

function stripImageMarkup(text = "") {
  return text
    .replace(/<img[^>]*>/gi, "")
    .replace(/!\[[^\]]*]\(([^)]+)\)/gi, "")
    .trim();
}

function formatAssistantHtml(text) {
  const escaped = escapeHtml(text);
  const withLinks = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noreferrer" class="text-[#b5487f] underline break-all">$1</a>'
  );
  return withLinks.replace(/\n/g, "<br />");
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
  if (typeof payload === "string") {
    return {
      text: stripImageMarkup(payload.trim()),
      images: findImageUrlsInText(payload.trim()),
    };
  }

  if (!payload || typeof payload !== "object") {
    return { text: "", images: [] };
  }

  const candidates = [
    payload.answer,
    payload.response,
    payload.reply,
    payload.message,
    payload.output,
    payload.data?.answer,
    payload.data?.response,
    payload.data?.reply,
    payload.data?.message,
  ];

  const rawText = candidates.find((item) => typeof item === "string" && item.trim())?.trim() || "";
  const text = stripImageMarkup(rawText);
  const images = [...new Set([...extractImages(payload), ...findImageUrlsInText(rawText)])];

  return { text, images };
}

export default function ChatAssistantPage() {
  const composerInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const endRef = useRef(null);

  const [messages, setMessages] = useState(() => [
    {
      id: "welcome",
      role: "assistant",
      text: WELCOME_MESSAGE,
      html: formatAssistantHtml(WELCOME_MESSAGE),
      images: [],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const selectedImagePreview = useMemo(
    () => (selectedImage ? URL.createObjectURL(selectedImage) : null),
    [selectedImage]
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, selectedImagePreview]);

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

  const sendText = async (message) => {
    const response = await axios.post(
      `${CHATBOT_API_BASE}/v1/chat`,
      { message, query: message, prompt: message },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      }
    );

    return extractReply(response.data);
  };

  const sendImage = async (message, imageFile) => {
    const formData = new FormData();
    formData.append("message", message);
    formData.append("query", message);
    formData.append("prompt", message);
    formData.append("image", imageFile);
    formData.append("file", imageFile);

    const response = await axios.post(`${CHATBOT_API_BASE}/v1/chat/with-image`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
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

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const imageToSend = selectedImage;
    clearSelectedImage();

    try {
      const result = imageToSend
        ? await sendImage(trimmed || "Please analyze this skin image.", imageToSend)
        : await sendText(trimmed);

      const responseText = result.text || ERROR_MESSAGE;
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: responseText,
          html: formatAssistantHtml(responseText),
          images: result.images || [],
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (error) {
      console.error("Chat assistant error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          text: ERROR_MESSAGE,
          html: formatAssistantHtml(ERROR_MESSAGE),
          images: [],
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
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
              onClick={() =>
                setMessages([
                  {
                    id: "welcome",
                    role: "assistant",
                    text: WELCOME_MESSAGE,
                    html: formatAssistantHtml(WELCOME_MESSAGE),
                    images: [],
                    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  },
                ])
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1f2937] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#111827]"
            >
              <FaPlus />
              New conversation
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-[28px] border border-[#f0d7e3] bg-white/85 p-5 shadow-[0_16px_32px_rgba(83,33,58,0.06)] backdrop-blur">
          <p className="text-sm font-semibold text-[#1f2937]">Helpful starters</p>
          <div className="mt-4 space-y-3">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                className="w-full rounded-2xl border border-[#f0d7e3] bg-[#fffafc] px-4 py-3 text-left text-sm leading-6 text-[#4b5563] transition hover:border-[#eb61a2] hover:bg-[#fff2f8]"
              >
                {prompt}
              </button>
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
                      {message.images.map((imageUrl) => (
                        <a
                          key={imageUrl}
                          href={imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="group overflow-hidden rounded-3xl border border-[#f0d7e3] bg-[#fff8fb]"
                        >
                          <img
                            src={imageUrl}
                            alt="Assistant response visual"
                            className="h-52 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                          />
                          <div className="border-t border-[#f0d7e3] px-4 py-3 text-xs font-medium text-[#b5487f]">
                            Open image
                          </div>
                        </a>
                      ))}
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
                    selectedImage
                      ? "Add a note for this skin image..."
                      : "Message Skin.me Assistant..."
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
