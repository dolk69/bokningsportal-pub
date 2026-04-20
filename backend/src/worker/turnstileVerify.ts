// Copyright (C) 2026 embsign AB
// SPDX-License-Identifier: AGPL-3.0-only

import type { Env } from "./types.js";

export const verifyTurnstileToken = async (request: Request, env: Env, token: string) => {
  const secret = env.TURNSTILE_SECRET?.trim();
  if (!secret) {
    return { ok: false, error: "missing_turnstile_secret" as const };
  }
  try {
    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      undefined;
    const form = new URLSearchParams();
    form.set("secret", secret);
    form.set("response", token);
    if (ip) {
      form.set("remoteip", ip);
    }
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    if (!response.ok) {
      return { ok: false, error: "turnstile_unavailable" as const };
    }
    const payload = (await response.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };
    if (!payload?.success) {
      return { ok: false, error: "turnstile_invalid" as const, codes: payload?.["error-codes"] || [] };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "turnstile_unavailable" as const };
  }
};
