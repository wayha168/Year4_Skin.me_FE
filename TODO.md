- [x] Analyze why /v1/chat returns 422 in ChatAssistantPage.jsx
- [x] Update sendText() payload/headers to match backend schema more reliably (remove duplicate fields, ensure required fields only)
- [x] Add better error logging for 422 (print error.response.data in UI/console)
- [x] Retry logic: only retry as multipart/form-data when backend indicates body/content-type mismatch
- [x] Ensure chat composer doesn’t get stuck after 422 (loading=false, message appended appropriately)
- [ ] Run Next.js dev server / lint to verify no syntax/runtime errors


