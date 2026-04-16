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

    if (e.key === "Enter") {
      const uid = buffer.trim();
      buffer = "";
      if (uid) {
        e.preventDefault();
        onUid(uid);
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

  win.addEventListener("keydown", onKeyDown, true);
  return () => win.removeEventListener("keydown", onKeyDown, true);
};

/**
 * @param {HTMLElement} root
 * @param {{ tenantName: string; loading: boolean; error: string; popupMessage: string; popupIsError: boolean }} state
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
    text: "Blippa din tagg eller iLoq-nyckel för att logga in",
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

  const column = createElement("div", {
    className: "web-kiosk-idle-column",
    children,
  });

  const wrap = [column];

  if (state.popupMessage) {
    wrap.push(
      createElement("div", {
        className: state.popupIsError ? "web-kiosk-popup web-kiosk-popup-error" : "web-kiosk-popup web-kiosk-popup-info",
        text: state.popupMessage,
      })
    );
  }

  root.append(
    createElement("div", {
      className: "web-kiosk-idle-inner",
      children: wrap,
    })
  );
};
