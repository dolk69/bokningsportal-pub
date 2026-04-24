// Copyright (C) 2026 embsign AB
// SPDX-License-Identifier: AGPL-3.0-only

import { createElement } from "../hooks/dom.js";
import { BookingSummary } from "./BookingSummary.js";
import { buildCalendarDownloadPageUrl, buildCalendarQrImageUrl } from "../utils/calendarExport.js";
import { calendarPlusIcon } from "../utils/icons.js";

export const BookingCalendarModal = ({ isOpen, booking, isKioskMode, isMobile = false, onClose, onCancel }) => {
  if (!isOpen) {
    return null;
  }

  const bookingId = booking?.bookingId || booking?.id || "";
  const calendarUrl = bookingId ? buildCalendarDownloadPageUrl({ bookingId }) : "";
  const calendarQrImageUrl = calendarUrl ? buildCalendarQrImageUrl(calendarUrl) : "";
  const summary = booking
    ? {
        resource: booking.serviceName || "-",
        date: `${booking.dayLabel || ""} ${booking.dateLabel || ""}`.trim() || "-",
        time: booking.timeLabel || "-",
        duration: "-",
        price: "-",
        bookingMessage: booking.bookingMessage || "",
      }
    : null;

  return createElement("div", {
    className: "modal-overlay",
    children: [
      createElement("div", {
        className: "modal card",
        children: [
          createElement("div", { className: "modal-title", text: "Kalenderbokning" }),
          summary ? BookingSummary({ summary }) : null,
          !isMobile && calendarQrImageUrl
            ? createElement("img", {
                className: "confirmation-qr-image",
                attrs: {
                  src: calendarQrImageUrl,
                  alt: "QR-kod för kalenderfil",
                },
              })
            : null,
          calendarUrl && !isKioskMode && isMobile
            ? createElement("div", {
                className: "booking-calendar-action confirmation-calendar-action",
                children: [
                  createElement("div", {
                    className: "calendar-download-help",
                    text: "Tryck på kalenderikonen för att lägga till en kalendernotis i mobilen.",
                  }),
                  createElement("a", {
                    className: "calendar-inline-link",
                    children: [calendarPlusIcon()],
                    attrs: {
                      href: calendarUrl,
                      title: "Ladda ner kalenderfil",
                      "aria-label": "Ladda ner kalenderfil",
                      target: "_blank",
                      rel: "noopener noreferrer",
                    },
                  }),
                ],
              })
            : calendarUrl && !isKioskMode
              ? createElement("a", {
                  className: "booking-download-link",
                  text: "Öppna kalenderlänk",
                  attrs: {
                    href: calendarUrl,
                    target: "_blank",
                    rel: "noopener noreferrer",
                  },
                })
            : null,
          createElement("div", {
            className: "modal-footer",
            children: [
              createElement("button", {
                className: "secondary-button",
                text: "Stäng",
                onClick: onClose,
              }),
              createElement("button", {
                className: "secondary-button admin-btn-delete",
                text: "Avboka",
                onClick: onCancel,
              }),
            ],
          }),
        ].filter(Boolean),
      }),
    ],
  });
};
