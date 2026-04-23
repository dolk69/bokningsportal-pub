// Copyright (C) 2026 embsign AB
// SPDX-License-Identifier: AGPL-3.0-only

import { createElement } from "../hooks/dom.js";

export const BookingObjectsTable = ({ bookingObjects, onEdit, onCopy, onDelete }) =>
  createElement("table", {
    className: "admin-table",
    children: [
      createElement("thead", {
        children: [
          createElement("tr", {
            children: [
              createElement("th", { text: "Namn" }),
              createElement("th", { text: "Typ" }),
              createElement("th", { text: "Slot" }),
              createElement("th", { text: "Bokningsfönster" }),
              createElement("th", { text: "Max" }),
              createElement("th", { text: "Prisintervall" }),
              createElement("th", { text: "Status" }),
              createElement("th", { text: "" }),
            ],
          }),
        ],
      }),
      createElement("tbody", {
        children: bookingObjects.map((item) =>
          createElement("tr", {
            children: [
              createElement("td", { text: item.name }),
              createElement("td", { text: item.type }),
              createElement("td", { text: item.slotDisplay || item.slotDuration }),
              createElement("td", { text: `${item.windowMin}–${item.windowMax}` }),
              createElement("td", { text: item.maxBookings }),
              createElement("td", {
                text: (() => {
                  const prices = [
                    item.priceMonday,
                    item.priceTuesday,
                    item.priceWednesday,
                    item.priceThursday,
                    item.priceFriday,
                    item.priceSaturday,
                    item.priceSunday,
                  ]
                    .map((value) => Number(value || 0))
                    .filter((value) => Number.isFinite(value));
                  const min = prices.length ? Math.min(...prices) : 0;
                  const max = prices.length ? Math.max(...prices) : 0;
                  return min === max ? `${min} kr` : `${min}-${max} kr`;
                })(),
              }),
              createElement("td", {
                children: [
                  createElement("span", {
                    className: `status-pill ${item.status === "Aktiv" ? "active" : "inactive"}`,
                    text: item.status,
                  }),
                ],
              }),
              createElement("td", {
                className: "admin-table-actions",
                children: [
                  createElement("div", {
                    className: "admin-action-group",
                    children: [
                      createElement("button", {
                        className: "secondary-button admin-btn-edit",
                        text: "Redigera",
                        onClick: () => onEdit(item),
                      }),
                      createElement("button", {
                        className: "secondary-button admin-btn-add",
                        text: "Kopiera",
                        onClick: () => onCopy(item),
                      }),
                      onDelete
                        ? createElement("button", {
                            className: "secondary-button admin-btn-delete",
                            text: "Ta bort",
                            onClick: () => onDelete(item),
                          })
                        : null,
                    ].filter(Boolean),
                  }),
                ],
              }),
            ],
          })
        ),
      }),
    ],
  });
