/**
 * Session persistence for participant search sessions.
 * Stores session tokens in localStorage so participants can
 * return to their photos without re-taking a selfie.
 *
 * Cookie is set for same-site access across page reloads.
 */

const STORAGE_KEY = "baspen-sessions";
const COOKIE_NAME = "baspen-session";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface StoredSession {
  eventId: string;
  sessionToken: string;
  slug: string;
  createdAt: number;
}

interface SessionStore {
  sessions: StoredSession[];
}

function getStore(): SessionStore {
  if (typeof window === "undefined") return { sessions: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { sessions: [] };
    return JSON.parse(raw) as SessionStore;
  } catch {
    return { sessions: [] };
  }
}

function setStore(store: SessionStore) {
  if (typeof window === "undefined") return;
  // Prune expired sessions
  const now = Date.now();
  store.sessions = store.sessions.filter(
    (s) => now - s.createdAt < SESSION_TTL_MS
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/**
 * Save a search session for an event.
 */
export function saveSession(
  eventId: string,
  sessionToken: string,
  slug: string
) {
  const store = getStore();
  // Update or add
  const existing = store.sessions.find((s) => s.eventId === eventId);
  if (existing) {
    existing.sessionToken = sessionToken;
    existing.createdAt = Date.now();
  } else {
    store.sessions.push({
      eventId,
      sessionToken,
      slug,
      createdAt: Date.now(),
    });
  }
  setStore(store);

  // Also set cookie for server-side access
  if (typeof document !== "undefined") {
    const expires = new Date(Date.now() + SESSION_TTL_MS).toUTCString();
    document.cookie = `${COOKIE_NAME}-${eventId}=${sessionToken}; path=/; expires=${expires}; SameSite=Lax`;
  }
}

/**
 * Get a saved session for an event.
 */
export function getSession(eventId: string): StoredSession | null {
  const store = getStore();
  const session = store.sessions.find((s) => s.eventId === eventId);
  if (!session) return null;
  // Check expiry
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    clearSession(eventId);
    return null;
  }
  return session;
}

/**
 * Get all active sessions (for "return to my photos" across events).
 */
export function getAllSessions(): StoredSession[] {
  const store = getStore();
  const now = Date.now();
  return store.sessions.filter((s) => now - s.createdAt < SESSION_TTL_MS);
}

/**
 * Clear session for an event.
 */
export function clearSession(eventId: string) {
  const store = getStore();
  store.sessions = store.sessions.filter((s) => s.eventId !== eventId);
  setStore(store);

  // Clear cookie
  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE_NAME}-${eventId}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}
