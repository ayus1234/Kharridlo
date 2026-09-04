/**
 * Kharridlo Session Identifier Utility
 * Generates and persists an opaque client-side session ID for cart and interaction tracking.
 * Strictly avoids capturing PII.
 */

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") {
    return "server_session_placeholder";
  }

  const PRIMARY_KEY = "kharridlo_session_id";
  const LEGACY_KEY = "dhankriya_session_id";
  let sessionId = localStorage.getItem(PRIMARY_KEY) || localStorage.getItem(LEGACY_KEY);

  if (!sessionId) {
    const randomHex = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now().toString(36);
    sessionId = `sess_${randomHex}_${timestamp}`;
    localStorage.setItem(PRIMARY_KEY, sessionId);
  } else if (!localStorage.getItem(PRIMARY_KEY)) {
    localStorage.setItem(PRIMARY_KEY, sessionId);
  }

  return sessionId;
}
