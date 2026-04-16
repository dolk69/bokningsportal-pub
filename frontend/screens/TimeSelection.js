// Copyright (C) 2026 embsign AB
// SPDX-License-Identifier: AGPL-3.0-only

import { createElement } from "../hooks/dom.js";
import { TimeslotButton } from "../components/TimeslotButton.js";
import { CancelBookingModal } from "../components/CancelBookingModal.js";

const legend = () =>
  createElement("div", {
    className: "status-legend",
    children: [
      legendItem("dot-available", "Ledig"),
      legendItem("dot-booked", "Upptagen"),
      legendItem("dot-mine", "Bokad"),
      legendItem("dot-blocked", "Blockerad"),
      legendItem("dot-disabled", "Passerad"),
    ],
  });

const legendItem = (dotClass, label) =>
  createElement("div", {
    className: "legend-item",
    children: [
      createElement("span", { className: `legend-dot ${dotClass}` }),
      createElement("span", { text: label }),
    ],
  });

export const TimeSelection = ({
  serviceName,
  weekLabel,
  weekSlots,
  expectedWeekSlots,
  selectedSlotId,
  onSelect,
  onPrev,
  onNext,
  canPrev,
  canNext,
  state,
  cancelModalOpen,
  cancelBooking,
  onCloseCancel,
  onConfirmCancel,
  isAdminView = false,
}) => {
  const headingText = serviceName?.trim()
    ? `Lediga tider för ${serviceName.trim()}`
    : "Lediga tider";
  const heading = createElement("h1", { className: "booking-object-heading", text: headingText });

  const nav = createElement("div", {
    className: "calendar-header",
    children: [
      createElement("button", {
        className: "secondary-button",
        text: "‹ Föregående",
        onClick: onPrev,
        attrs: { disabled: !canPrev },
      }),
      createElement("div", { className: "calendar-title", text: weekLabel }),
      createElement("button", {
        className: "secondary-button",
        text: "Nästa ›",
        onClick: onNext,
        attrs: { disabled: !canNext },
      }),
    ],
  });

  const isLoading = state === "loading";
  const hasSlots = weekSlots.length > 0;

  let bodyContent;
  if (isLoading) {
    const loadingDays = expectedWeekSlots?.length
      ? expectedWeekSlots
      : Array.from({ length: 7 }).map((_, index) => ({
          id: `loading-day-${index}`,
          label: "—",
          slots: Array.from({ length: 3 }),
        }));
    bodyContent = createElement("div", {
      className: "timeslot-grid",
      children: loadingDays.map((day, index) =>
        createElement("div", {
          className: "timeslot-column",
          children: [
            createElement("div", {
              className: `timeslot-header ${index === 6 ? "weekday-sunday" : ""}`.trim(),
              text: day.label || "—",
            }),
            ...Array.from({ length: day.slots?.length || 3 }).map((slot) =>
              createElement("div", {
                className: "skeleton timeslot-skeleton-item",
                attrs:
                  slot?.priceText && slot.priceText.trim().length > 0
                    ? { "data-has-price": "true" }
                    : {},
              })
            ),
          ],
        })
      ),
    });
  } else if (state === "error" && !hasSlots) {
    bodyContent = createElement("div", { className: "error-state", text: "Kunde inte ladda tider." });
  } else if (!hasSlots) {
    bodyContent = createElement("div", { className: "empty-state", text: "Inga lediga tider hittades." });
  } else {
    const columns = weekSlots.map((day, index) =>
      createElement("div", {
        className: "timeslot-column",
        children: [
          createElement("div", {
            className: `timeslot-header ${index === 6 ? "weekday-sunday" : ""}`.trim(),
            text: day.label,
          }),
          ...day.slots.map((slot) =>
            TimeslotButton({
              slot,
              isSelected: selectedSlotId === slot.id,
              onSelect: () => onSelect(slot),
              isAdminView,
            })
          ),
        ],
      })
    );

    bodyContent = createElement("div", { className: "timeslot-grid", children: columns });
  }

  const content = createElement("div", {
    className: "calendar card timeslot-card",
    children: [heading, nav, bodyContent],
  });

  const cancelModal = cancelModalOpen
    ? CancelBookingModal({
        booking: cancelBooking,
        onClose: onCloseCancel,
        onConfirm: onConfirmCancel,
      })
    : null;

  return createElement("section", {
    className: "screen booking-screen",
    children: [content, legend(), cancelModal].filter(Boolean),
  });
};
