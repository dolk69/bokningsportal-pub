// Copyright (C) 2026 embsign AB
// SPDX-License-Identifier: AGPL-3.0-only

import { createElement } from "../hooks/dom.js";
import { anglesLeftIcon, rightFromBracketIcon } from "../utils/icons.js";

export const Header = ({ apartmentId, tenantName, showBack = false, onBack, onLogout, isMobile = false }) => {
  if (isMobile) {
    const rightActions = [
      showBack
        ? createElement("button", {
            className: "icon-button logout-icon-button",
            children: [anglesLeftIcon()],
            onClick: onBack,
            attrs: { "aria-label": "Tillbaka" },
          })
        : null,
      createElement("button", {
        className: "icon-button logout-icon-button",
        children: [rightFromBracketIcon()],
        onClick: onLogout,
        attrs: { "aria-label": "Logga ut" },
      }),
    ].filter(Boolean);

    return createElement("header", {
      className: "header mobile-topbar",
      children: [
        createElement("div", {
          className: "mobile-topbar-actions",
          children: rightActions,
        }),
        createElement("div", {
          className: "mobile-topbar-title",
          text: tenantName || "Bokningsportal",
        }),
        createElement("div", {
          className: "mobile-topbar-identity",
          text: `Lägenhet ${apartmentId}`,
        }),
      ],
    });
  }

  const title = showBack
    ? createElement("button", {
        className: "header-back",
        text: "⟵ Tillbaka",
        onClick: onBack,
      })
    : createElement("div", {
        className: "header-title",
        children: [createElement("span", { text: tenantName || "Bokningsportal" })],
      });

  const meta = createElement("div", {
    className: "header-meta",
    children: [createElement("span", { className: "meta-pill", text: `Lägenhet ${apartmentId}` })],
  });

  const actions = createElement("div", {
    className: "header-actions",
    children: [createElement("button", { className: "ghost-button", text: "Logga ut", onClick: onLogout })],
  });

  return createElement("header", {
    className: "header card",
    children: [
      createElement("div", { className: "header-left", children: [title] }),
      createElement("div", { className: "header-center", children: [meta] }),
      createElement("div", { className: "header-right", children: [actions] }),
    ],
  });
};
