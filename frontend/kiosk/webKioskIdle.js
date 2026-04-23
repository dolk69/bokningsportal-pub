// Copyright (C) 2026 embsign AB
// SPDX-License-Identifier: AGPL-3.0-only

import { createElement, clearElement } from "../hooks/dom.js";

const HID_BUFFER_MS = 300;
const HID_MAX_LEN = 64;

/**
 * HID-tangentbordsläsare: buffrar alfanumeriska tecken, skickar UID vid Enter (samma mönster som Android-kiosken).
 * @param {Window} win
 * @param {{ onUid: (uid: string) => void }} opts
 * @returns {() => void} avregistrera lyssnare
 */
export const attachHidRfidListener = (win, { onUid }) => {
  let buffer = "";
  let lastTs = 0;

  const emitUid = (value) => {
    const normalized = String(value || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
    if (normalized) {
      onUid(normalized);
    }
  };

  const onKeyDown = (e) => {
    const target = e.target;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable)
    ) {
      return;
    }

    const now = Date.now();
    if (now - lastTs > HID_BUFFER_MS) {
      buffer = "";
    }
    lastTs = now;

    // Låt tangentkombinationer som Ctrl+V passera till browsern/paste-handlern.
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    if (e.key === "Enter") {
      const uid = buffer.trim();
      buffer = "";
      if (uid) {
        e.preventDefault();
        emitUid(uid);
      }
      return;
    }

    if (e.key.length === 1 && /[0-9A-Za-z]/.test(e.key)) {
      if (buffer.length < HID_MAX_LEN) {
        buffer += e.key.toUpperCase();
      }
      e.preventDefault();
    }
  };

  const onPaste = (e) => {
    const target = e.target;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable)
    ) {
      return;
    }
    const pasted = e.clipboardData?.getData("text") || "";
    if (!pasted.trim()) {
      return;
    }
    e.preventDefault();
    buffer = "";
    emitUid(pasted);
  };

  win.addEventListener("keydown", onKeyDown, true);
  win.addEventListener("paste", onPaste, true);
  return () => {
    win.removeEventListener("keydown", onKeyDown, true);
    win.removeEventListener("paste", onPaste, true);
  };
};

/**
 * @param {HTMLElement} root
 * @param {{
 *   tenantName: string;
 *   loading: boolean;
 *   error: string;
 *   popupMessage: string;
 *   popupIsError: boolean;
 *   turnstileSiteKey?: string;
 *   turnstilePendingUid?: string;
 *   turnstileError?: string;
 * }} state
 */
export const renderWebKioskIdle = (root, state) => {
  clearElement(root);
  root.className = "web-kiosk-idle-root";

  const title = createElement("div", {
    className: "web-kiosk-idle-title",
    text: "Digital Bokningstavla",
  });
  const forLabel = createElement("div", {
    className: "web-kiosk-idle-for",
    text: "för",
  });
  const tenant = createElement("div", {
    className: "web-kiosk-idle-tenant",
    text: state.tenantName?.trim() || "Bokningsskärm",
  });
  const hint = createElement("div", {
    className: "web-kiosk-idle-hint",
    text: state.turnstileSiteKey
      ? "Verifiera nedan och försök sedan igen med din tagg."
      : "Blippa din tagg eller iLoq-nyckel för att logga in",
  });

  const children = [title, forLabel, tenant, hint];

  if (state.loading) {
    children.push(
      createElement("div", {
        className: "web-kiosk-idle-status",
        text: "Laddar…",
      })
    );
  } else if (state.error) {
    children.push(
      createElement("div", {
        className: "web-kiosk-idle-status web-kiosk-idle-status-error",
        text: state.error,
      })
    );
  }

  if (state.turnstileSiteKey && state.turnstilePendingUid) {
    const wrapChildren = [
      createElement("div", {
        className: "web-kiosk-idle-turnstile-copy",
        text: "Säkerhetsläge är aktivt. Bekräfta att du är människa:",
      }),
      createElement("div", {
        className: "web-kiosk-idle-turnstile-host",
        attrs: { id: "kiosk-web-turnstile-host" },
      }),
    ];
    if (state.turnstileError) {
      wrapChildren.push(
        createElement("div", {
          className: "web-kiosk-idle-status web-kiosk-idle-status-error",
          text: state.turnstileError,
        })
      );
    }
    children.push(
      createElement("div", {
        className: "web-kiosk-idle-turnstile-wrap",
        children: wrapChildren,
      })
    );
  }

  const column = createElement("div", {
    className: "web-kiosk-idle-column",
    children,
  });

  const wrap = [];
  if (state.popupMessage) {
    wrap.push(
      createElement("div", {
        className: state.popupIsError ? "web-kiosk-popup web-kiosk-popup-error" : "web-kiosk-popup web-kiosk-popup-info",
        text: state.popupMessage,
      })
    );
  }
  wrap.push(column);

  root.append(
    createElement("div", {
      className: "web-kiosk-idle-inner",
      children: wrap,
    })
  );
};
