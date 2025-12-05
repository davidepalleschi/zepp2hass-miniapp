import hmUI from "@zos/ui";
import * as alarmMgr from "@zos/alarm";
import { BasePage } from "@zeppos/zml/base-page";
import { queryPermission, requestPermission } from "@zos/app";
import { localStorage } from "@zos/storage";
import {
  HEADER_TITLE,
  STATUS_CIRCLE_GLOW,
  STATUS_CIRCLE,
  STATUS_TEXT,
  SCROLL_HINT,
  LAST_SYNC_LABEL,
  LAST_SYNC_VALUE,
  SUCCESS_LABEL,
  SUCCESS_VALUE,
  ERROR_LABEL,
  ERROR_VALUE,
  LAST_ERROR_LABEL,
  LAST_ERROR_VALUE,
  FETCH_BUTTON,
  BOTTOM_SPACER,
} from "zosLoader:./index.[pf].layout.js";
import {
  COLOR_SUCCESS,
  COLOR_ERROR,
  COLOR_WARNING,
  COLOR_NEUTRAL,
} from "../utils/config/constants";

const permissions = ["device:os.bg_service"];
const serviceFile = "app-service/background_service";
const STORAGE_KEY_STATS = "zepp2hass_stats";

// ============================================================================
// STATISTICS
// ============================================================================

function loadStats() {
  try {
    const statsJson = localStorage.getItem(STORAGE_KEY_STATS);
    if (statsJson) {
      const parsed = JSON.parse(statsJson);
      // Ensure all fields exist
      return {
        successCount: parsed.successCount || 0,
        errorCount: parsed.errorCount || 0,
        lastSyncTime: parsed.lastSyncTime || null,
        lastStatus: parsed.lastStatus || "unknown",
        lastError: parsed.lastError || null,
      };
    }
  } catch (error) {
    console.log(`[PAGE] Error loading stats: ${error}`);
  }
  return {
    successCount: 0,
    errorCount: 0,
    lastSyncTime: null,
    lastStatus: "unknown",
    lastError: null,
  };
}

function saveStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
  } catch (error) {
    console.log(`[PAGE] Error saving stats: ${error}`);
  }
}

// ============================================================================
// SERVICE MANAGEMENT
// ============================================================================

function getIntervalMinutes(vm) {
  if (!vm.state.settings || !vm.state.settings["intervalMinutes"]) {
    return 1;
  }
  const interval = parseInt(vm.state.settings["intervalMinutes"], 10);
  return isNaN(interval) ? 1 : interval;
}

function permissionRequest(vm) {
  const [result2] = queryPermission({ permissions });

  if (result2 === 0) {
    requestPermission({
      permissions,
      callback([result2]) {
        if (result2 === 2) {
          startTimeService(vm);
        }
      },
    });
  } else if (result2 === 2) {
    startTimeService(vm);
  }
}

function startTimeService(vm) {
  console.log(`=== starting service ===`);

  const alarms = alarmMgr.getAllAlarms();
  if (alarms.length > 0) {
    alarms.forEach((alarm) => alarmMgr.cancel(alarm));
  }

  const intervalMinutes = getIntervalMinutes(vm);

  alarmMgr.set({
    url: serviceFile,
    repeat_type: alarmMgr.REPEAT_MINUTE,
    repeat_period: intervalMinutes,
    repeat_duration: 1,
    store: true,
    delay: 40,
  });

  hmUI.showToast({ text: `Started! ${intervalMinutes}min` });

  if (pageWidgets && pageWidgets.statusCircle) {
    pageWidgets.statusCircle.setProperty(hmUI.prop.COLOR, COLOR_WARNING);
    pageWidgets.statusCircleGlow.setProperty(hmUI.prop.COLOR, COLOR_WARNING);
    pageWidgets.statusText.setProperty(hmUI.prop.TEXT, "Starting...");
  }
}

// ============================================================================
// UI HELPERS
// ============================================================================

function getStatusColor(status) {
  switch (status) {
    case "success": return COLOR_SUCCESS;
    case "error": return COLOR_ERROR;
    case "pending": return COLOR_WARNING;
    default: return COLOR_NEUTRAL;
  }
}

function getStatusText(status) {
  switch (status) {
    case "success": return "Sync OK";
    case "error": return "Sync Failed";
    case "pending": return "Syncing...";
    default: return "Not running";
  }
}

function updateUI(vm) {
  const stats = loadStats();

  if (pageWidgets && pageWidgets.statusCircle) {
    const statusColor = getStatusColor(stats.lastStatus);
    pageWidgets.statusCircle.setProperty(hmUI.prop.COLOR, statusColor);
    pageWidgets.statusCircleGlow.setProperty(hmUI.prop.COLOR, statusColor);
    pageWidgets.statusText.setProperty(hmUI.prop.TEXT, getStatusText(stats.lastStatus));
    pageWidgets.lastSyncValue.setProperty(hmUI.prop.TEXT, stats.lastSyncTime || "--:--");
    pageWidgets.successValue.setProperty(hmUI.prop.TEXT, stats.successCount.toString());
    pageWidgets.errorValue.setProperty(hmUI.prop.TEXT, stats.errorCount.toString());
    pageWidgets.lastErrorValue.setProperty(hmUI.prop.TEXT, stats.lastError || "None");
  }
}

// ============================================================================
// PAGE
// ============================================================================

let pageWidgets = null;

Page(
  BasePage({
    state: { settings: null },

    onInit() {
      console.log(`[PAGE] onInit`);
      this.fetchSettingsFromPhone();
    },

    build() {
      console.log(`[PAGE] Building UI...`);
      const vm = this;
      pageWidgets = {};

      // ═══════════════════════════════════════════════════════════════
      // SECTION 1: HEADER + STATUS (visible immediately)
      // ═══════════════════════════════════════════════════════════════
      hmUI.createWidget(hmUI.widget.TEXT, HEADER_TITLE);

      pageWidgets.statusCircleGlow = hmUI.createWidget(hmUI.widget.CIRCLE, STATUS_CIRCLE_GLOW);
      pageWidgets.statusCircle = hmUI.createWidget(hmUI.widget.CIRCLE, STATUS_CIRCLE);
      pageWidgets.statusText = hmUI.createWidget(hmUI.widget.TEXT, STATUS_TEXT);
      
      // Scroll hint
      hmUI.createWidget(hmUI.widget.TEXT, SCROLL_HINT);

      // ═══════════════════════════════════════════════════════════════
      // SECTION 2: LAST SYNC (scroll down)
      // ═══════════════════════════════════════════════════════════════
      hmUI.createWidget(hmUI.widget.TEXT, LAST_SYNC_LABEL);
      pageWidgets.lastSyncValue = hmUI.createWidget(hmUI.widget.TEXT, LAST_SYNC_VALUE);

      // ═══════════════════════════════════════════════════════════════
      // SECTION 3: COUNTERS (scroll down more)
      // ═══════════════════════════════════════════════════════════════
      hmUI.createWidget(hmUI.widget.TEXT, SUCCESS_LABEL);
      pageWidgets.successValue = hmUI.createWidget(hmUI.widget.TEXT, SUCCESS_VALUE);

      hmUI.createWidget(hmUI.widget.TEXT, ERROR_LABEL);
      pageWidgets.errorValue = hmUI.createWidget(hmUI.widget.TEXT, ERROR_VALUE);

      // ═══════════════════════════════════════════════════════════════
      // SECTION 4: LAST ERROR (scroll down more)
      // ═══════════════════════════════════════════════════════════════
      hmUI.createWidget(hmUI.widget.TEXT, LAST_ERROR_LABEL);
      pageWidgets.lastErrorValue = hmUI.createWidget(hmUI.widget.TEXT, LAST_ERROR_VALUE);

      // ═══════════════════════════════════════════════════════════════
      // SECTION 5: APPLY SETTINGS BUTTON (scroll to bottom)
      // ═══════════════════════════════════════════════════════════════
      hmUI.createWidget(hmUI.widget.BUTTON, {
        ...FETCH_BUTTON,
        click_func: () => {
          console.log("=== Apply Settings clicked ===");
          permissionRequest(vm);
        },
      });

      // Bottom spacer to ensure button is fully visible
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        ...BOTTOM_SPACER,
        color: 0x000000,
        alpha: 0,
      });

      // Initial update
      setTimeout(() => updateUI(vm), 100);
    },

    onShow() {
      updateUI(this);
    },

    onCall(req, res) {
      if (req.method === "GET_settings") {
        res(null, this.state.settings);
      } else if (req.method === "UPDATE_stats") {
        const { success, timestamp, errorMessage } = req.params || {};
        const stats = loadStats();
        if (success) {
          stats.successCount++;
          stats.lastStatus = "success";
          stats.lastError = null;
        } else {
          stats.errorCount++;
          stats.lastStatus = "error";
          stats.lastError = errorMessage || "Unknown error";
        }
        stats.lastSyncTime = timestamp;
        saveStats(stats);
        updateUI(this);
        res(null, { received: true });
      }
    },

    onDestroy() {
      pageWidgets = null;
    },

    fetchSettingsFromPhone() {
      return this.request({ method: "GET_settings", params: {} })
        .then((result) => {
          this.state.settings = result;
          updateUI(this);
        })
        .catch((error) => {
          console.error("[PAGE] Error:", error);
        });
    },
  })
);
