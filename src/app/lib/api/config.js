/**
 * API configuration - no backend URL in client code.
 * All requests use same-origin paths; Next.js rewrites proxy to the backend.
 * Set BACKEND_URL in .env.local (server-only) for the real backend; never expose it to the client.
 */

/** Base path for API requests (same origin). Use this for all fetch/axios base URLs. */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://backend.skinme.store/api/v1";
/** Base path for uploaded assets (same origin when using rewrites). */
export const UPLOADS_BASE = process.env.NEXT_PUBLIC_UPLOADS_BASE ?? "";

/** Base URL for the separate chatbot service. */
export const CHATBOT_API_BASE = (process.env.NEXT_PUBLIC_CHATBOT_API_BASE ?? "https://chatbot.skinme.store").replace(/\/+$/, "");
