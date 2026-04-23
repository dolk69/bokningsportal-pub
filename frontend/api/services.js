// Copyright (C) 2026 embsign AB
// SPDX-License-Identifier: AGPL-3.0-only

import { apiRequest } from "./client.js";

const formatDuration = (service) => {
  if (service.booking_type === "full-day") {
    return "1 dygn";
  }
  if (service.slot_duration_minutes) {
    const hours = service.slot_duration_minutes / 60;
    return hours % 1 === 0 ? `${hours} timmar` : `${hours.toString().replace(".", ",")} timmar`;
  }
  return "";
};

const formatPriceText = (service) => {
  const dailyCents = [
    Number(service.price_monday_cents ?? service.price_weekday_cents ?? 0),
    Number(service.price_tuesday_cents ?? service.price_weekday_cents ?? 0),
    Number(service.price_wednesday_cents ?? service.price_weekday_cents ?? 0),
    Number(service.price_thursday_cents ?? service.price_weekday_cents ?? 0),
    Number(service.price_friday_cents ?? service.price_weekday_cents ?? 0),
    Number(service.price_saturday_cents ?? service.price_weekend_cents ?? 0),
    Number(service.price_sunday_cents ?? service.price_weekend_cents ?? 0),
  ];
  if (dailyCents.every((value) => value <= 0)) {
    return "";
  }

  const dailyKr = dailyCents.map((value) => Math.round(value / 100));
  const low = Math.min(...dailyKr);
  const high = Math.max(...dailyKr);
  if (low === high) {
    return `Debiteras: ${low} kr`;
  }
  return `Debiteras: ${low}-${high} kr`;
};

export const getServices = async () => {
  const { services } = await apiRequest("/services");
  return services.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description || "",
    duration: formatDuration(service),
    nextAvailable: service.next_available,
    priceText: formatPriceText(service),
    bookingType: service.booking_type,
    slotDuration: service.slot_duration_minutes || "",
    fullDayStartTime: service.full_day_start_time,
    fullDayEndTime: service.full_day_end_time,
    timeSlotStartTime: service.time_slot_start_time,
    timeSlotEndTime: service.time_slot_end_time,
    windowMin: Number(service.window_min_days),
    windowMax: Number(service.window_max_days),
    bookingConfirmationMessage: service.booking_confirmation_message || "",
    maxBookings: Number(service.max_bookings_limit ?? service.max_bookings),
    maxBookingsLimit: Number(service.max_bookings_limit ?? service.max_bookings),
    maxBookingsReached: service.max_bookings_reached === true,
    bookingGroupId: service.group_id || "",
    priceMonday: Number(service.price_monday_cents ?? service.price_weekday_cents ?? 0),
    priceTuesday: Number(service.price_tuesday_cents ?? service.price_weekday_cents ?? 0),
    priceWednesday: Number(service.price_wednesday_cents ?? service.price_weekday_cents ?? 0),
    priceThursday: Number(service.price_thursday_cents ?? service.price_weekday_cents ?? 0),
    priceFriday: Number(service.price_friday_cents ?? service.price_weekday_cents ?? 0),
    priceSaturday: Number(service.price_saturday_cents ?? service.price_weekend_cents ?? 0),
    priceSunday: Number(service.price_sunday_cents ?? service.price_weekend_cents ?? 0),
  }));
};
