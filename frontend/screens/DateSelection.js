// Copyright (C) 2026 embsign AB
// SPDX-License-Identifier: AGPL-3.0-only

import { createElement } from "../hooks/dom.js";
import { Calendar } from "../components/Calendar.js";
import { CancelBookingModal } from "../components/CancelBookingModal.js";
import { BookingCalendarModal } from "../components/BookingCalendarModal.js";

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

export const DateSelection = ({
  serviceName,
  monthLabel,
  days,
  expectedDays,
  selectedDateId,
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
  bookingCalendarModalOpen,
  selectedOverviewBooking,
  onCloseBookingCalendar,
  onCancelFromBookingCalendar,
  isKioskMode = false,
  isAdminView = false,
}) => {
  const headingText = serviceName?.trim()
    ? `Lediga dagar för ${serviceName.trim()}`
    : "Lediga dagar";
  const heading = createElement("h1", { className: "booking-object-heading", text: headingText });

  const hasRenderableDays = days.some((day) => day.status !== "outside");
  const hasRenderableExpectedDays = (expectedDays || []).some((day) => day.status !== "outside");

  let content;
  if (state === "loading" && !hasRenderableDays && hasRenderableExpectedDays) {
    content = Calendar({
      monthLabel,
      days: expectedDays,
      selectedDateId,
      onSelect: () => {},
      onPrev,
      onNext,
      canPrev,
      canNext,
      isLoading: true,
      isAdminView,
      bookingHeading: heading,
    });
  } else if (state === "loading" && !hasRenderableDays) {
    content = Calendar({
      monthLabel,
      days: [],
      selectedDateId,
      onSelect: () => {},
      onPrev,
      onNext,
      canPrev,
      canNext,
      isLoading: true,
      isAdminView,
      bookingHeading: heading,
    });
  } else if (state === "error" && !hasRenderableDays) {
    content = createElement("div", {
      children: [
        Calendar({
          monthLabel,
          days: expectedDays || [],
          selectedDateId,
          onSelect: () => {},
          onPrev,
          onNext,
          canPrev,
          canNext,
          isAdminView,
          bookingHeading: heading,
        }),
        createElement("div", { className: "error-state", text: "Kunde inte ladda datum." }),
      ],
    });
  } else if (!hasRenderableDays) {
    content = createElement("div", {
      children: [
        Calendar({
          monthLabel,
          days: expectedDays || [],
          selectedDateId,
          onSelect: () => {},
          onPrev,
          onNext,
          canPrev,
          canNext,
          isAdminView,
          bookingHeading: heading,
        }),
        createElement("div", { className: "empty-state", text: "Inga lediga datum hittades." }),
      ],
    });
  } else {
    content = Calendar({
      monthLabel,
      days,
      selectedDateId,
      onSelect,
      onPrev,
      onNext,
      canPrev,
      canNext,
      isAdminView,
      bookingHeading: heading,
    });
  }

  const cancelModal = cancelModalOpen
    ? CancelBookingModal({
        booking: cancelBooking,
        onClose: onCloseCancel,
        onConfirm: onConfirmCancel,
      })
    : null;

  const bookingCalendarModal = BookingCalendarModal({
    isOpen: bookingCalendarModalOpen,
    booking: selectedOverviewBooking,
    isKioskMode,
    onClose: onCloseBookingCalendar,
    onCancel: onCancelFromBookingCalendar,
  });

  return createElement("section", {
    className: "screen booking-screen",
    children: [content, legend(), cancelModal, bookingCalendarModal].filter(Boolean),
  });
};
