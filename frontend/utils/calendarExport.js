// Copyright (C) 2026 embsign AB
// SPDX-License-Identifier: AGPL-3.0-only

import { getApiBase } from "../api/client.js";

const escapeIcsText = (value) =>
  String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

const toIcsFloatingDateTime = (isoValue) => {
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
};

const getCalendarFileName = (eventData) => {
  const startDate = new Date(eventData.startTime);
  const datePart = Number.isNaN(startDate.getTime())
    ? "bokning"
    : startDate.toISOString().slice(0, 10);
  return `bokning-${datePart}.ics`;
};

const sanitizeFileToken = (value) => String(value || "").replace(/[^a-zA-Z0-9_-]/g, "");

export const buildCalendarIcs = (eventData) => {
  if (!eventData?.title || !eventData?.startTime || !eventData?.endTime) {
    return null;
  }
  const dtStart = toIcsFloatingDateTime(eventData.startTime);
  const dtEnd = toIcsFloatingDateTime(eventData.endTime);
  if (!dtStart || !dtEnd) {
    return null;
  }

  const nowStamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const uid = `${dtStart}-${Math.random().toString(36).slice(2)}@brf-bokningsportal`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BRF Bokningsportal//SE",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(eventData.title)}`,
    `DESCRIPTION:${escapeIcsText(eventData.description || "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ];
  return lines.join("\r\n");
};

export const downloadCalendarEvent = (eventData) => {
  const ics = buildCalendarIcs(eventData);
  if (!ics) {
    return false;
  }

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = getCalendarFileName(eventData);
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
};

export const buildCalendarDownloadPageUrl = (eventData) => {
  if (!eventData?.bookingId) {
    return "";
  }
  const apiBase = getApiBase();
  const url = new URL(`${apiBase}/calendar`, window.location.origin);
  url.searchParams.set("booking_id", sanitizeFileToken(eventData.bookingId));
  return url.toString();
};

export const buildCalendarQrImageUrl = (calendarPageUrl) => {
  if (!calendarPageUrl) {
    return "";
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(calendarPageUrl)}`;
};

export const buildCalendarQrFromEvent = (eventData) => {
  const calendarFileUrl = buildCalendarDownloadPageUrl(eventData);
  if (!calendarFileUrl) {
    return "";
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(calendarFileUrl)}`;
};

export const parseCalendarEventFromUrl = (url) => {
  const title = url.searchParams.get("title") || "";
  const startTime = url.searchParams.get("start") || "";
  const endTime = url.searchParams.get("end") || "";
  const description = url.searchParams.get("description") || "";
  if (!title || !startTime || !endTime) {
    return null;
  }
  if (Number.isNaN(new Date(startTime).getTime()) || Number.isNaN(new Date(endTime).getTime())) {
    return null;
  }
  return { title, startTime, endTime, description };
};
