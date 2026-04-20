// Copyright (C) 2026 embsign AB
// SPDX-License-Identifier: AGPL-3.0-only

import type { Env } from "./types.js";
import { verifyTurnstileToken } from "./turnstileVerify.js";

const GLOBAL_WINDOW_MS = 10 * 60 * 1000;
const GLOBAL_FAIL_THRESHOLD = 10;
const UNDER_ATTACK_TTL_SEC = 30 * 60;
const KV_KEY_UNDER_ATTACK = "rfid:under_attack";
const KV_KEY_GLOBAL_FAILS = "rfid:global_failures_v1";

const BACKOFF_BASE_MS = 500;
const BACKOFF_CAP_MS = 300_000;
const BACKOFF_MAX_EXP = 16;

type RfidAbuseKv = NonNullable<Env["RFID_ABUSE_KV"]>;

type IpBackoffState = { failCount: number; blockedUntil: number };

const json = (data: unknown, init: ResponseInit = {}) => {
  const headers = new Headers(init.headers || undefined);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8");
  }
  if (!headers.has("cache-control")) {
    headers.set("cache-control", "no-store");
  }
  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
};

export const getClientIpForRfidAbuse = (request: Request): string =>
  request.headers.get("cf-connecting-ip")?.trim() ||
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  "unknown";

const ipStateKey = (ip: string) => `rfid:ip:${ip.replaceAll(":", "_")}`;

const readIpState = async (kv: RfidAbuseKv, ip: string): Promise<IpBackoffState | null> => {
  const raw = await kv.get(ipStateKey(ip), "text");
  if (!raw) {
    return null;
  }
  try {
    const o = JSON.parse(raw) as Partial<IpBackoffState>;
    if (typeof o.failCount === "number" && typeof o.blockedUntil === "number") {
      return { failCount: o.failCount, blockedUntil: o.blockedUntil };
    }
  } catch {
    /* ignore */
  }
  return null;
};

export const isRfidUnderAttack = async (env: Env): Promise<boolean> => {
  if (!env.RFID_ABUSE_KV) {
    return false;
  }
  return (await env.RFID_ABUSE_KV.get(KV_KEY_UNDER_ATTACK, "text")) === "1";
};

/** Innan RFID-uppslag: backoff per IP, Turnstile vid global attack. */
export const enforceRfidAbusePolicy = async (
  request: Request,
  env: Env,
  body: Record<string, unknown>
): Promise<Response | null> => {
  if (!env.RFID_ABUSE_KV) {
    return null;
  }
  const kv = env.RFID_ABUSE_KV;
  const ip = getClientIpForRfidAbuse(request);
  const now = Date.now();

  const ipState = await readIpState(kv, ip);
  if (ipState && ipState.blockedUntil > now) {
    const retryAfter = Math.max(1, Math.ceil((ipState.blockedUntil - now) / 1000));
    const headers = new Headers();
    headers.set("Retry-After", String(retryAfter));
    return json(
      {
        detail: "rfid_rate_limited",
        retry_after_seconds: retryAfter,
      },
      { status: 429, headers }
    );
  }

  const underAttack = (await kv.get(KV_KEY_UNDER_ATTACK, "text")) === "1";
  const secretConfigured = Boolean(env.TURNSTILE_SECRET?.trim());
  if (underAttack && secretConfigured) {
    const token = String(body?.turnstile_token || "").trim();
    if (!token) {
      return json(
        {
          detail: "rfid_requires_turnstile",
          requires_turnstile: true,
          turnstile_site_key: String(env.TURNSTILE_SITE_KEY || "").trim(),
        },
        { status: 403 }
      );
    }
    const turnstile = await verifyTurnstileToken(request, env, token);
    if (!turnstile.ok) {
      const detail =
        turnstile.error === "turnstile_invalid" && "codes" in turnstile && turnstile.codes?.length
          ? `turnstile_invalid:${turnstile.codes.join(",")}`
          : turnstile.error || "turnstile_invalid";
      const status = turnstile.error === "missing_turnstile_secret" ? 500 : 400;
      return json({ detail }, { status });
    }
  }

  return null;
};

const nextBackoffDelayMs = (failCount: number): number => {
  const exp = Math.min(Math.max(0, failCount - 1), BACKOFF_MAX_EXP);
  return Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** exp);
};

/** Efter misslyckad RFID-autentisering (401/403 från logiken). */
export const recordRfidAuthFailure = async (env: Env, request: Request): Promise<void> => {
  if (!env.RFID_ABUSE_KV) {
    return;
  }
  const kv = env.RFID_ABUSE_KV;
  const ip = getClientIpForRfidAbuse(request);
  const now = Date.now();

  const prev = (await readIpState(kv, ip)) || { failCount: 0, blockedUntil: 0 };
  const failCount = prev.failCount + 1;
  const delayMs = nextBackoffDelayMs(failCount);
  const blockedUntil = now + delayMs;
  await kv.put(ipStateKey(ip), JSON.stringify({ failCount, blockedUntil }), {
    expirationTtl: 86_400,
  });

  const raw = await kv.get(KV_KEY_GLOBAL_FAILS, "text");
  let timestamps: number[] = [];
  try {
    const parsed = JSON.parse(raw || "[]");
    if (Array.isArray(parsed)) {
      timestamps = parsed.filter((t) => typeof t === "number") as number[];
    }
  } catch {
    timestamps = [];
  }
  const windowStart = now - GLOBAL_WINDOW_MS;
  timestamps = timestamps.filter((t) => t > windowStart);
  timestamps.push(now);
  await kv.put(KV_KEY_GLOBAL_FAILS, JSON.stringify(timestamps), {
    expirationTtl: Math.ceil(GLOBAL_WINDOW_MS / 1000) + 120,
  });
  if (timestamps.length >= GLOBAL_FAIL_THRESHOLD) {
    await kv.put(KV_KEY_UNDER_ATTACK, "1", { expirationTtl: UNDER_ATTACK_TTL_SEC });
  }
};

export const recordRfidAuthSuccess = async (env: Env, request: Request): Promise<void> => {
  if (!env.RFID_ABUSE_KV) {
    return;
  }
  const ip = getClientIpForRfidAbuse(request);
  await env.RFID_ABUSE_KV.delete(ipStateKey(ip));
};
