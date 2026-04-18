// Copyright (C) 2026 embsign AB
// SPDX-License-Identifier: AGPL-3.0-only

import type { Env } from "./types.js";

/** Instruktioner till bokningsskärm (Android/web) via t.ex. GET /api/kiosk/screen/status. */
export const buildKioskScreenInstructions = (env: Env) => {
  const latestAndroidVersion = String(env.KIOSK_LATEST_ANDROID_VERSION || "").trim();
  const androidDownloadUrl = String(env.KIOSK_ANDROID_DOWNLOAD_URL || "").trim();
  const messageSv = String(env.KIOSK_UPDATE_MESSAGE_SV || "").trim();

  const hasAny = Boolean(latestAndroidVersion || androidDownloadUrl || messageSv);
  if (!hasAny) {
    return null;
  }

  return {
    latest_android_version: latestAndroidVersion || null,
    android_download_url: androidDownloadUrl || null,
    message_sv: messageSv || null,
  };
};
