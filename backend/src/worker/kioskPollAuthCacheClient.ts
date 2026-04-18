// Copyright (C) 2026 embsign AB
// SPDX-License-Identifier: AGPL-3.0-only

import type { D1Database, Env } from "./types.js";

const sha256Hex = async (value: string) => {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const pollAuthKey = (tokenHash: string) => `v1:poll:${tokenHash.toLowerCase()}`;

const getTtlSeconds = (env: Env) => {
  const raw = env.KIOSK_POLL_AUTH_CACHE_TTL_SECONDS;
  const n = raw != null && raw !== "" ? Number(raw) : 30;
  if (!Number.isFinite(n)) {
    return 30;
  }
  return Math.min(300, Math.max(5, Math.floor(n)));
};

/** Samma form som getScreenByToken (bs.* + tenant_name + tenant_last_changed_at). */
export const getScreenByTokenPollCached = async (env: Env, db: D1Database, token: string) => {
  const kv = env.KIOSK_EDGE_KV;
  if (!kv) {
    return (await getScreenByTokenUncached(db, token)) as Record<string, unknown> | null;
  }
  const tokenHash = (await sha256Hex(token)).toLowerCase();
  const key = pollAuthKey(tokenHash);
  const raw = await kv.get(key, "text");
  if (typeof raw === "string" && raw) {
    try {
      const base = JSON.parse(raw) as Record<string, unknown>;
      const sid = String(base.id || "");
      if (!sid) {
        return (await getScreenByTokenUncached(db, token)) as Record<string, unknown> | null;
      }
      const delta = await refreshPollScreenFromDb(db, token, sid);
      if (!delta) {
        await invalidateKioskPollAuthCache(env, token);
        return (await getScreenByTokenUncached(db, token)) as Record<string, unknown> | null;
      }
      return {
        ...base,
        name: delta.name ?? base.name,
        tenant_name: delta.tenant_name ?? base.tenant_name,
        tenant_last_changed_at: delta.tenant_last_changed_at ?? base.tenant_last_changed_at,
      };
    } catch {
      /* ignore corrupt */
    }
  }

  const screen = (await getScreenByTokenUncached(db, token)) as Record<string, unknown> | null;
  if (screen) {
    const ttl = getTtlSeconds(env);
    try {
      await kv.put(key, JSON.stringify(screen), { expirationTtl: ttl });
    } catch (err) {
      console.error("KIOSK_EDGE_KV poll auth put error", err);
    }
  }
  return screen;
};

const getScreenByTokenUncached = async (db: D1Database, token: string) =>
  (await db
    .prepare(
      `SELECT bs.*, t.name AS tenant_name, t.last_changed_at AS tenant_last_changed_at
       FROM booking_screens bs
       JOIN tenants t ON t.id = bs.tenant_id
       WHERE bs.screen_token = ?
         AND bs.is_active = 1
       LIMIT 1`
    )
    .bind(token)
    .first()) as Record<string, unknown> | null;

/** En rad per poll vid cache-träff: färsk tenant-ETag + skärmnamn, samt att token fortfarande är giltig. */
const refreshPollScreenFromDb = async (db: D1Database, token: string, screenId: string) =>
  (await db
    .prepare(
      `SELECT bs.name AS name, t.name AS tenant_name, t.last_changed_at AS tenant_last_changed_at
       FROM booking_screens bs
       JOIN tenants t ON t.id = bs.tenant_id
       WHERE bs.id = ?
         AND bs.screen_token = ?
         AND bs.is_active = 1
       LIMIT 1`
    )
    .bind(screenId, token)
    .first()) as Record<string, unknown> | null;

export const invalidateKioskPollAuthCache = async (env: Env, screenToken: string) => {
  const kv = env.KIOSK_EDGE_KV;
  if (!kv || !screenToken) {
    return;
  }
  try {
    const tokenHash = (await sha256Hex(screenToken)).toLowerCase();
    await kv.delete(pollAuthKey(tokenHash));
  } catch (err) {
    console.error("KIOSK_EDGE_KV poll auth delete error", err);
  }
};
