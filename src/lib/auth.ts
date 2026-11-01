import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "nb_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 hari

function authSecret(): string {
  return process.env.AUTH_SECRET || "nangerang-benderang-dev-secret";
}

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "bendahara123";
}

/** Token sesi = "<expiry_timestamp>.<hmac(expiry)>" — stateless, aman buat serverless */
export function createSessionToken(): string {
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const sig = createHmac("sha256", authSecret()).update(String(exp)).digest("hex");
  return `${exp}.${sig}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = createHmac("sha256", authSecret()).update(expStr).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isAuthed(req: NextRequest): boolean {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

export function checkPassword(input: string): boolean {
  return input.length > 0 && input === adminPassword();
}
