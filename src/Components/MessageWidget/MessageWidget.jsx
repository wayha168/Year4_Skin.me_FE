"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaComments, FaWandSparkles } from "react-icons/fa6";

const AUTH_PAGES = new Set(["/login", "/signup"]);

export default function MessageWidget() {
  const pathname = usePathname();

  if (pathname === "/chatbot") return null;

  const mobileMarginClass = AUTH_PAGES.has(pathname) ? "" : "max-[510px]:mb-[4.7rem]";

  return (
    <Link
      href="/chatbot"
      className={`fixed bottom-5 right-5 z-[999] flex items-center gap-3 rounded-full border border-white/60 bg-[linear-gradient(135deg,#eb61a2_0%,#ff9f6e_100%)] px-4 py-3 text-white shadow-[0_18px_40px_rgba(235,97,162,0.35)] transition-transform duration-200 hover:scale-[1.02] ${mobileMarginClass}`}
      aria-label="Open Skin.me assistant"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#c03f82] shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
        <FaComments className="text-lg" />
      </span>
      <span className="hidden min-[420px]:block">
        <span className="flex items-center gap-2 text-sm font-semibold leading-none">
          <FaWandSparkles className="text-[12px]" />
          Skin.me Assistant
        </span>
        <span className="mt-1 block text-[11px] leading-none text-white/80">
          Chat, upload skin images, get help
        </span>
      </span>
    </Link>
  );
}
