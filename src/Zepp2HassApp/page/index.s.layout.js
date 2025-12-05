import * as hmUI from "@zos/ui";
import { px } from "@zos/utils";

import {
  DEFAULT_COLOR,
  DEFAULT_COLOR_TRANSPARENT,
  COLOR_SUCCESS,
  COLOR_ERROR,
  COLOR_NEUTRAL,
  COLOR_TEXT_PRIMARY,
  COLOR_TEXT_SECONDARY,
} from "../utils/config/constants";
import { DEVICE_WIDTH, DEVICE_HEIGHT } from "../utils/config/device";

const centerX = DEVICE_WIDTH / 2;

// ============================================================================
// VERTICAL SCROLLABLE LAYOUT - Big text, well spaced
// For square displays (smaller)
// ============================================================================

// Total content height
export const CONTENT_HEIGHT = px(700);

// ============================================================================
// SECTION 1: HEADER + STATUS
// ============================================================================

export const HEADER_TITLE = {
  x: px(0),
  y: px(20),
  w: DEVICE_WIDTH,
  h: px(50),
  color: COLOR_TEXT_PRIMARY,
  text_size: px(42),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text: "Zepp2Hass",
};

// Big status circle
export const STATUS_CIRCLE_GLOW = {
  center_x: centerX,
  center_y: px(140),
  radius: px(55),
  color: COLOR_NEUTRAL,
  alpha: 50,
};

export const STATUS_CIRCLE = {
  center_x: centerX,
  center_y: px(140),
  radius: px(42),
  color: COLOR_NEUTRAL,
};

export const STATUS_TEXT = {
  x: px(0),
  y: px(210),
  w: DEVICE_WIDTH,
  h: px(50),
  color: COLOR_TEXT_SECONDARY,
  text_size: px(32),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text: "Not running",
};

// Scroll hint
export const SCROLL_HINT = {
  x: px(0),
  y: px(275),
  w: DEVICE_WIDTH,
  h: px(30),
  color: COLOR_TEXT_SECONDARY,
  text_size: px(20),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text: "↓ scroll down ↓",
};

// ============================================================================
// SECTION 2: LAST SYNC
// ============================================================================

export const LAST_SYNC_LABEL = {
  x: px(0),
  y: px(330),
  w: DEVICE_WIDTH,
  h: px(40),
  color: COLOR_TEXT_SECONDARY,
  text_size: px(26),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text: "Last Sync",
};

export const LAST_SYNC_VALUE = {
  x: px(0),
  y: px(370),
  w: DEVICE_WIDTH,
  h: px(80),
  color: COLOR_TEXT_PRIMARY,
  text_size: px(64),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text: "--:--",
};

// ============================================================================
// SECTION 3: COUNTERS
// ============================================================================

export const SUCCESS_LABEL = {
  x: px(20),
  y: px(470),
  w: DEVICE_WIDTH / 2 - px(20),
  h: px(32),
  color: COLOR_TEXT_SECONDARY,
  text_size: px(24),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text: "OK",
};

export const SUCCESS_VALUE = {
  x: px(20),
  y: px(505),
  w: DEVICE_WIDTH / 2 - px(20),
  h: px(70),
  color: COLOR_SUCCESS,
  text_size: px(56),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text: "0",
};

export const ERROR_LABEL = {
  x: DEVICE_WIDTH / 2,
  y: px(470),
  w: DEVICE_WIDTH / 2 - px(20),
  h: px(32),
  color: COLOR_TEXT_SECONDARY,
  text_size: px(24),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text: "ERR",
};

export const ERROR_VALUE = {
  x: DEVICE_WIDTH / 2,
  y: px(505),
  w: DEVICE_WIDTH / 2 - px(20),
  h: px(70),
  color: COLOR_ERROR,
  text_size: px(56),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text: "0",
};

// ============================================================================
// SECTION 4: LAST ERROR MESSAGE
// ============================================================================

export const LAST_ERROR_LABEL = {
  x: px(0),
  y: px(590),
  w: DEVICE_WIDTH,
  h: px(28),
  color: COLOR_TEXT_SECONDARY,
  text_size: px(20),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text: "Last Error",
};

export const LAST_ERROR_VALUE = {
  x: px(20),
  y: px(620),
  w: DEVICE_WIDTH - px(40),
  h: px(60),
  color: COLOR_ERROR,
  text_size: px(18),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.WRAP,
  text: "None",
};

// ============================================================================
// SECTION 5: ACTION BUTTON
// ============================================================================

export const FETCH_BUTTON = {
  x: (DEVICE_WIDTH - px(260)) / 2,
  y: px(700),
  w: px(260),
  h: px(80),
  text_size: px(28),
  radius: px(40),
  normal_color: DEFAULT_COLOR,
  press_color: DEFAULT_COLOR_TRANSPARENT,
  text: "Apply\nSettings",
};

// Spacer at the bottom to ensure button is not cut off
export const BOTTOM_SPACER = {
  x: px(0),
  y: px(800),
  w: DEVICE_WIDTH,
  h: px(40),
};
