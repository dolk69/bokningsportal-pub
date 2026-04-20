// Copyright (C) 2026 embsign AB
// SPDX-License-Identifier: AGPL-3.0-only

import { apiRequest, getApiBase } from "./client.js";

export const getSession = () => apiRequest("/session");

export const getBootstrap = () => apiRequest("/bootstrap");

/**
 * RFID-inloggning (ingen Authorization). Stödjer valfri Turnstile vid global attack.
 * @param {string} uid
 * @param {string} [tenantId]
 * @param {{ turnstileToken?: string }} [opts]
 */
export const loginWithRfid = async (uid, tenantId, opts = {}) => {
  const base = getApiBase();
  const payload = { uid };
  if (tenantId) {
    payload.tenant_id = String(tenantId).trim();
  }
  if (opts.turnstileToken) {
    payload.turnstile_token = String(opts.turnstileToken).trim();
  }
  const res = await fetch(`${base}/rfid-login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => ({}))
    : {};

  if (!res.ok) {
    const err = new Error(data.detail || "internal_error");
    err.status = res.status;
    err.detail = data.detail;
    err.requiresTurnstile = data.requires_turnstile === true;
    err.turnstileSiteKey =
      typeof data.turnstile_site_key === "string" ? data.turnstile_site_key : "";
    err.retryAfterSeconds =
      typeof data.retry_after_seconds === "number" ? data.retry_after_seconds : undefined;
    throw err;
  }
  return data;
};

/** Publik kontext för webbkiosk (ingen inloggning). */
export const getKioskWebContext = (tenantId) =>
  apiRequest(`/kiosk/web-context?tenant_id=${encodeURIComponent(String(tenantId || "").trim())}`, {
    omitAuthorization: true,
  });

export const rotatePersonalLoginLink = () =>
  apiRequest("/kiosk/access-token", {
    method: "POST",
  });

export const getDemoLinks = () => apiRequest("/demo-links");
