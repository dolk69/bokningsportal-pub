-- Copyright (C) 2026 embsign AB
-- SPDX-License-Identifier: AGPL-3.0-only

ALTER TABLE booking_objects ADD COLUMN booking_confirmation_message TEXT;
ALTER TABLE booking_objects ADD COLUMN price_monday_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE booking_objects ADD COLUMN price_tuesday_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE booking_objects ADD COLUMN price_wednesday_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE booking_objects ADD COLUMN price_thursday_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE booking_objects ADD COLUMN price_friday_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE booking_objects ADD COLUMN price_saturday_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE booking_objects ADD COLUMN price_sunday_cents INTEGER NOT NULL DEFAULT 0;

UPDATE booking_objects
SET
  price_monday_cents = COALESCE(price_weekday_cents, 0),
  price_tuesday_cents = COALESCE(price_weekday_cents, 0),
  price_wednesday_cents = COALESCE(price_weekday_cents, 0),
  price_thursday_cents = COALESCE(price_weekday_cents, 0),
  price_friday_cents = COALESCE(price_weekday_cents, 0),
  price_saturday_cents = COALESCE(price_weekend_cents, 0),
  price_sunday_cents = COALESCE(price_weekend_cents, 0)
WHERE
  COALESCE(price_monday_cents, 0) = 0
  AND COALESCE(price_tuesday_cents, 0) = 0
  AND COALESCE(price_wednesday_cents, 0) = 0
  AND COALESCE(price_thursday_cents, 0) = 0
  AND COALESCE(price_friday_cents, 0) = 0
  AND COALESCE(price_saturday_cents, 0) = 0
  AND COALESCE(price_sunday_cents, 0) = 0;
