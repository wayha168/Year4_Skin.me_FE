# TODO - Google Login Fix

- [x] Inspect AuthContext.jsx and login/page.jsx for Google login flow mismatch
- [x] Update `src/app/lib/Authentication/AuthContext.jsx` to support passing `redirectUri` to backend and expose `setLoginError`
- [x] Update `src/app/(Auth)/login/page.jsx` to remove missing redirect helper and supply a valid `redirect_uri`
- [x] Ensure POST /api/v1/auth/google payload matches what backend expects (`{ code, redirectUri }`)
- [x] Build succeeds (`npm run build`)
- [ ] Smoke test: click “Continue with Google” and verify backend returns 200 + cookie `token` set
