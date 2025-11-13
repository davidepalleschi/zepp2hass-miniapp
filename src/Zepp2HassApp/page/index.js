import hmUI from "@zos/ui";
import * as alarmMgr from "@zos/alarm";
import { BasePage } from "@zeppos/zml/base-page";
import { queryPermission, requestPermission } from "@zos/app";
import { FETCH_BUTTON } from "zosLoader:./index.[pf].layout.js";

const permissions = ["device:os.bg_service"];
const serviceFile = "app-service/background_service";

// Get interval from storage (default to 1 minute for now)
function getIntervalMinutes() {
  return 1; // Default to 1 minute
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

  const alarms = alarmMgr.getAllAlarms();
  const biodataAlarmService = alarms.length === 2;
  const intervalMinutes = getIntervalMinutes();

  if (!biodataAlarmService) {
    const option = {
      url: serviceFile,
      repeat_type: alarmMgr.REPEAT_MINUTE,
      repeat_period: intervalMinutes,
      repeat_duration: 1,
      store: true,
      delay: 40,
    };
    console.log(`=== starting alarm: ${serviceFile} === Interval: ${intervalMinutes} min, Alarms: ${alarms.length}: ${JSON.stringify(alarms)}`);
    alarmMgr.set(option);
    hmUI.showToast({ text: `Service alarm set (${intervalMinutes} min interval)` });
  } else {
    console.log(`=== alarm already exists === Interval: ${intervalMinutes} min, Alarms: ${alarms.length}: ${JSON.stringify(alarms)}`);
    hmUI.showToast({ text: `Service alarm already set (${intervalMinutes} min interval)` });
  }
}

Page(
  BasePage({
    state: {},
    onInit() {
      console.log(`========================================`);
      console.log(`[PAGE] 📄 Page onInit`);
      console.log(`========================================`);
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
    onHide() {
      console.log(`[PAGE] 🙈 Page hidden`);
    },
    onDestroy() {
      console.log(`========================================`);
      console.log(`[PAGE] ⚠️  PAGE BEING DESTROYED`);
      console.log(`[PAGE] Background service should continue running...`);
      console.log(`========================================`);
    }
  })
);
