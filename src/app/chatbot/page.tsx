"use client";

import Link from "next/link";
import { FaHome } from "react-icons/fa";
import { FaWandSparkles } from "react-icons/fa6";
import ChatAssistantPage from "../../Components/Chatbot/ChatAssistantPage.jsx";

export default function ChatbotPage() {
  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#f6f2f6]">
      <header className="shrink-0 border-b border-[#e8dce4] bg-white">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#eb61a2] to-[#f59e6b] text-white shadow-[0_8px_20px_rgba(235,97,162,0.28)]"
              aria-hidden
            >
              <FaWandSparkles className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b5487f]">
                Skin.me
              </p>
              <h1 className="truncate text-[15px] font-semibold text-[#111827] sm:text-base">
                Assistant chat
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-[#111827] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f2937] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#eb61a2]"
            >
              <FaHome className="h-4 w-4 shrink-0" aria-hidden />
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">
        <ChatAssistantPage />
      </main>
    </div>
  );
}
