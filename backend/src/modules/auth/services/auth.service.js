/** backend/src/modules/auth/services/auth.service.js
 *  - Ký access/refresh
 *  - Tạo/rotate phiên (hash refresh) + ràng buộc UA/IP mềm
 *  - Thu hồi/đếm danh sách phiên
 */
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const AuthSession = require("../models/authSession.model");

const JWT_ALGS = ["HS256"];
const getAccessTTL     = () => process.env.ACCESS_TOKEN_TTL  || "10m";
const getRefreshTTL    = () => process.env.REFRESH_TOKEN_TTL || "7d";
const getAccessSecret  = () => process.env.JWT_ACCESS_SECRET  || process.env.JWT_SECRET;
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const genSessionId = () => "sess_" + crypto.randomUUID();

function getClientInfo(req) {
  const userAgent = (req.get("user-agent") || "").slice(0, 256);
  const xfwd = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ip = (xfwd || req.ip || "").toString();
  return { userAgent, ip };
}

function signAccessToken(user, sessionId) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, sid: sessionId },
    getAccessSecret(),
    { expiresIn: getAccessTTL(), algorithm: "HS256" }
  );
}
function signRefreshToken(user, sessionId) {
  return jwt.sign(
    { sub: user._id.toString(), sid: sessionId, email: user.email },
    getRefreshSecret(),
    { expiresIn: getRefreshTTL(), algorithm: "HS256" }
  );
}
function parseJwtExpToDate(token, secret) {
  const payload = jwt.verify(token, secret, { algorithms: JWT_ALGS });
  return new Date(payload.exp * 1000);
}

// So khớp mềm: UA prefix & IPv4 /24; IPv6 khớp tuyệt đối
function sameSubnetV4(a, b) {
  const A = a.split("."), B = b.split(".");
  if (A.length !== 4 || B.length !== 4) return false;
  return A.slice(0, 3).join(".") === B.slice(0, 3).join(".");
}
function looksSameClient(prev, nowUA, nowIP) {
  if (prev.userAgent && nowUA) {
    const okUA = nowUA.startsWith(prev.userAgent.slice(0, 32));
    if (!okUA) return false;
  }
  if (prev.ip && nowIP) {
    const isV6 = prev.ip.includes(":") || nowIP.includes(":");
    return isV6 ? prev.ip === nowIP : sameSubnetV4(prev.ip, nowIP);
  }
  return true;
}

async function createSessionAndTokens(user, req) {
  const sessionId = genSessionId();
  const refreshToken = signRefreshToken(user, sessionId);
  const refreshTokenExpiresAt = parseJwtExpToDate(refreshToken, getRefreshSecret());
  const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

  const { userAgent, ip } = getClientInfo(req);
  await AuthSession.create({
    sessionId,
    userId: user._id,
    email: user.email,
    refreshTokenHash,
    userAgent,
    ip,
    refreshTokenExpiresAt,
    lastUsedAt: new Date(),
  });

  const accessToken = signAccessToken(user, sessionId);
  return { accessToken, refreshToken, sessionId, refreshTokenExpiresAt };
}

async function rotateRefreshToken(oldToken, req) {
  let payload;
  try {
    payload = jwt.verify(oldToken, getRefreshSecret(), { algorithms: JWT_ALGS });
  } catch {
    throw new Error("Invalid refresh token");
  }

  const { sub: userId, sid: oldSid, email } = payload;
  const prev = await AuthSession.findOne({ sessionId: oldSid, userId, email });
  if (!prev || !prev.isActive()) throw new Error("Session revoked or expired");

  const ok = await bcrypt.compare(oldToken, prev.refreshTokenHash);
  if (!ok) {
    await AuthSession.updateMany(
      { userId },
      { $set: { revokedAt: new Date(), revokeReason: "token_mismatch" } }
    );
    throw new Error("Refresh token mismatch");
  }

  const { userAgent, ip } = getClientInfo(req);
  if (!looksSameClient(prev, userAgent, ip)) {
    await AuthSession.updateOne(
      { _id: prev._id },
      { $set: { revokedAt: new Date(), revokeReason: "client_change" } }
    );
    throw new Error("Client info changed");
  }

  await AuthSession.updateOne(
    { _id: prev._id },
    { $set: { revokedAt: new Date(), revokeReason: "rotated" } }
  );

  const User = require("../../users/models/user.model");
  const fullUser = await User.findById(userId)
    .select("_id email role name avatarUrl phone address");
  if (!fullUser) throw new Error("User not found");

  const { accessToken, refreshToken, sessionId, refreshTokenExpiresAt } =
    await createSessionAndTokens(fullUser, req);

  return { accessToken, refreshToken, sessionId, refreshTokenExpiresAt, user: fullUser };
}

async function revokeSession(sessionId, userId, reason = "manual") {
  await AuthSession.updateOne(
    { sessionId, userId },
    { $set: { revokedAt: new Date(), revokeReason: reason } }
  );
}
async function revokeAllSessions(userId, reason = "logout_all") {
  await AuthSession.updateMany(
    { userId },
    { $set: { revokedAt: new Date(), revokeReason: reason } }
  );
}
async function listUserSessions(userId) {
  return AuthSession.find({ userId }).sort({ createdAt: -1 }).select("-refreshTokenHash");
}

module.exports = {
  createSessionAndTokens,
  rotateRefreshToken,
  revokeSession,
  revokeAllSessions,
  listUserSessions,
  signAccessToken: signAccessToken,
};
