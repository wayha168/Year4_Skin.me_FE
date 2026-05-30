/**
 * Redirect URI for @react-oauth/google `flow: "auth-code"` (Google Identity Services popup).
 * Must be identical in: Google Cloud Console → OAuth client → Authorized redirect URIs,
 * this value passed to useGoogleLogin, and the backend Google token exchange.
 */
export function getGoogleOAuthRedirectUri() {
  if (typeof process === "undefined") return "postmessage";
  const v = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT_URI?.trim();
  return v || "postmessage";
}
