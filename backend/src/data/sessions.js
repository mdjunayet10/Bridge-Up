const crypto = require("crypto");

const sessions = new Map();

function getSessionTtlMs() {
  const parsed = Number(process.env.AUTH_SESSION_TTL_MS || 8 * 60 * 60 * 1000);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 8 * 60 * 60 * 1000;
  }

  return parsed;
}

function generateToken() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return crypto.randomBytes(32).toString("hex");
}

function cleanupExpiredSessions() {
  const now = Date.now();

  for (const [token, session] of sessions.entries()) {
    if (session.expiresAtMs <= now) {
      sessions.delete(token);
    }
  }
}

function createSession({ role, email, authSecret = "", displayName = "" }) {
  cleanupExpiredSessions();

  const now = Date.now();
  const ttlMs = getSessionTtlMs();
  const expiresAtMs = now + ttlMs;
  const token = generateToken();

  const session = {
    token,
    role: String(role || "").trim().toLowerCase() || "employee",
    email: String(email || "").trim().toLowerCase(),
    authSecret: String(authSecret || "").trim(),
    displayName: String(displayName || "").trim(),
    // Backward-compatible aliases for existing employer route helpers.
    employerEmail: String(email || "").trim().toLowerCase(),
    employerKey: String(authSecret || "").trim(),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(expiresAtMs).toISOString(),
    expiresAtMs
  };

  sessions.set(token, session);
  return session;
}

function getSessionByToken(token) {
  cleanupExpiredSessions();

  if (!token) {
    return null;
  }

  const session = sessions.get(token);
  if (!session) {
    return null;
  }

  if (session.expiresAtMs <= Date.now()) {
    sessions.delete(token);
    return null;
  }

  return session;
}

function revokeSession(token) {
  if (!token) {
    return false;
  }

  return sessions.delete(token);
}

module.exports = {
  createSession,
  getSessionByToken,
  revokeSession
};
