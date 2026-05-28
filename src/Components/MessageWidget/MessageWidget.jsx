"use client";

import { usePathname, useRouter } from "next/navigation";
import { FaComments } from "react-icons/fa6";
import useAuthContext from "../../app/lib/Authentication/AuthContext";

const AUTH_PAGES = new Set(["/login", "/signup"]);

export default function MessageWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();

  if (pathname === "/chatbot") return null;

  const mobileMarginClass = AUTH_PAGES.has(pathname) ? "" : "max-[770px]:mb-[4.7rem]";

  const handleChatClick = () => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/chatbot");
    } else {
      router.push("/chatbot");
    }
  };

  return (
    <button
      onClick={handleChatClick}
      className={`rounded-[15px] fixed bottom-5 right-5 z-[999] flex items-center justify-center  border border-white/60 bg-[#F0F0F0] p-5 text-white shadow-[-2px_5px_8px_rgba(0,0,0,0.15)] transition-transform duration-200 hover:scale-[1.02] ${mobileMarginClass}`}
      aria-label="Open Skin.me assistant"
    >
      <img src="/assets/ChatAI/AiChatIcon.svg" alt="AI Assistant" className="w-9 h-9" />
    </button>
  );
}
