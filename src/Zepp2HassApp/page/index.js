import hmUI from "@zos/ui";
import * as alarmMgr from "@zos/alarm";
import { BasePage } from "@zeppos/zml/base-page";
import { queryPermission, requestPermission } from "@zos/app";
import { FETCH_BUTTON } from "zosLoader:./index.[pf].layout.js";

const permissions = ["device:os.bg_service"];
const serviceFile = "app-service/background_service";

// Get interval from settings (default to 1 minute)
function getIntervalMinutes(vm) {
  if (!vm.state.settings || !vm.state.settings['intervalMinutes']) {
    return 1; // Default to 1 minute
  }
  // Parse the interval from settings (it's stored as a string)
  const interval = parseInt(vm.state.settings['intervalMinutes'], 10);
  return isNaN(interval) ? 1 : interval;
}

function permissionRequest(vm) {
  const [result2] = queryPermission({
    permissions,
  });

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
  console.log(`=== starting service: ${serviceFile} ===`);

  // Get all existing alarms
  const alarms = alarmMgr.getAllAlarms();
  console.log(`=== Found ${alarms.length} existing alarms: ${JSON.stringify(alarms)}`);
  
  // Delete all existing alarms
  if (alarms.length > 0) {
    alarms.forEach((alarm) => {
      console.log(`=== Deleting alarm with ID: ${alarm}`);
      alarmMgr.cancel(alarm);
    });
    console.log(`=== Deleted ${alarms.length} alarm(s)`);
  }
  
  // Get the interval from settings
  const intervalMinutes = getIntervalMinutes(vm);
  
  // Create a new alarm with the updated interval
  const option = {
    url: serviceFile,
    repeat_type: alarmMgr.REPEAT_MINUTE,
    repeat_period: intervalMinutes,
    repeat_duration: 1,
    store: true,
    delay: 40,
  };
  
  console.log(`=== Creating new alarm with ${intervalMinutes} min interval`);
  alarmMgr.set(option);
  hmUI.showToast({ text: `Service alarm set (${intervalMinutes} min interval)` });
}

Page(
  BasePage({
    state: {
      // Local state to store settings
      settings: null,
    },
    onInit() {
      console.log(`========================================`);
      console.log(`[PAGE] 📄 Page onInit`);
      console.log(`========================================`);
      // Fetch settings from phone when page initializes
      this.fetchSettingsFromPhone();
    },
    build() {
      console.log(`[PAGE] Building UI...`);
      const vm = this;
      hmUI.createWidget(hmUI.widget.BUTTON, {
        ...FETCH_BUTTON,
        click_func: (button_widget) => {
          console.log("=== User clicked the button ===");
          permissionRequest(vm);
        },
      });
    },
    onShow() {
      console.log(`[PAGE] 👁️  Page shown`);
    },
    onCall(req, res) {
      console.log(`[PAGE] onCall.method = ${req.method}`);
      if (req.method === 'GET_settings') {
        res(null, this.state.settings);
      }
    },
    onHide() {
      console.log(`[PAGE] 🙈 Page hidden`);
    },
    onDestroy() {
      console.log(`========================================`);
      console.log(`[PAGE] ⚠️  PAGE BEING DESTROYED`);
      console.log(`[PAGE] Background service should continue running...`);
      console.log(`========================================`);
    },
    fetchSettingsFromPhone() {
      return this.request({
        // This 'method' name must match the one in your app-side-service
        method: 'GET_settings',
        params: {
          // You can send any parameters here if needed
        },
      })
        .then((result) => {
          // Successfully received settings from the phone
          console.log('[PAGE] Got settings:', JSON.stringify(result));
          this.state.settings = result;
        })
        .catch((error) => {
          // An error occurred
          console.error('[PAGE] Error fetching settings:', error);
        });
    },
  })
);
