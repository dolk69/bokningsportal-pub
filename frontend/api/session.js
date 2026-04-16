// Copyright (C) 2026 embsign AB
// SPDX-License-Identifier: AGPL-3.0-only

import { apiRequest } from "./client.js";

export const getSession = () => apiRequest("/session");

export const getBootstrap = () => apiRequest("/bootstrap");


export const loginWithRfid = (uid, tenantId) =>
  apiRequest("/rfid-login", {
    method: "POST",
    body: JSON.stringify(
      tenantId ? { uid, tenant_id: String(tenantId).trim() } : { uid }
    ),
    omitAuthorization: true,
  });

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
