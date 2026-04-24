// Copyright (C) 2026 embsign AB
// SPDX-License-Identifier: AGPL-3.0-only

import { icon } from "@fortawesome/fontawesome-svg-core";
import { faAngleLeft, faAngleRight, faAnglesLeft, faCalendarPlus, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";

const toNode = (iconDef, className = "") => {
  const template = document.createElement("template");
  const classes = className ? className.split(/\s+/).filter(Boolean) : [];
  template.innerHTML = icon(iconDef, { classes }).html.join("");
  return template.content.firstElementChild;
};

export const angleLeftIcon = (className = "") => toNode(faAngleLeft, className);
export const angleRightIcon = (className = "") => toNode(faAngleRight, className);
export const anglesLeftIcon = (className = "") => toNode(faAnglesLeft, className);
export const calendarPlusIcon = (className = "") => toNode(faCalendarPlus, className);
export const rightFromBracketIcon = (className = "") => toNode(faRightFromBracket, className);
