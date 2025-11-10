import * as notificationMgr from "@zos/notification";
import { Time } from '@zos/sensor'
import { BasePage } from "@zeppos/zml/base-page";
import { HeartRate, Battery, BloodOxygen, BodyTemperature, Calorie, Distance, FatBurning, Pai, Screen, Sleep, Stand, Step, Stress, Wear, Workout } from "@zos/sensor";
import { getProfile } from '@zos/user'
import { getDeviceInfo } from '@zos/device'

const debugging = false;
const endPoint = "https://mariella.domotica.uk/api/zepp2hass/dav_watch"

// Store the last error that occurred
let lastError = null;

// Helper function to get current timestamp for logging
function getTimestamp() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// Consistent error logging function - easy to search for "[ERR]"
function logError(location, type, message, error = null) {
  const timestamp = getTimestamp();
  const errorMsg = error ? ` | ${error.message || String(error)}` : '';
  console.log(`[ERR] [${timestamp}] ${location}::${type}: ${message}${errorMsg}`);
  
  lastError = {
    timestamp: timestamp,
    type: type,
    location: location,
    message: message,
    error: error ? (error.message || String(error)) : null
  };
  
  return lastError;
}

// Safe wrapper for sensor operations
function safeSensorGet(sensor, methodName, defaultValue = null) {
  try {
    if (typeof sensor[methodName] === 'function') {
      return sensor[methodName]();
    }
    return defaultValue;
  } catch (error) {
    const sensorName = sensor ? sensor.constructor.name : 'Unknown';
    logError('sensor', `${sensorName}.${methodName}`, 'Sensor read failed', error);
    return defaultValue;
  }
}

// Send metrics data to server
function sendMetrics(vm) {
  // Guard: Check if vm and httpRequest are valid before proceeding
  if (!vm || !vm.httpRequest || typeof vm.httpRequest !== 'function') {
    logError('sendMetrics', 'invalid_vm', 'Service destroyed or httpRequest unavailable');
    return;
  }

  const timestamp = getTimestamp();
  const startTime = new Date().getTime();
  

  
  // Initialize sensors with error handling
  let battery, bloodOxygen, bodyTemperature, calorie, distance, fatBurning, heartRate, pai, screen, sleep, stand, step, stress, wear, workout;
  try {
    battery = new Battery();
    bloodOxygen = new BloodOxygen();
    bodyTemperature = new BodyTemperature();
    calorie = new Calorie();
    distance = new Distance();
    fatBurning = new FatBurning();
    heartRate = new HeartRate();
    pai = new Pai();
    screen = new Screen();
    sleep = new Sleep();
    stand = new Stand();
    step = new Step();
    stress = new Stress();
    wear = new Wear();
    workout = new Workout();
  } catch (error) {
    logError('sendMetrics', 'sensor_init', 'Failed to initialize sensors', error);
    return;
  }

  // Get user profile with error handling
  let userProfile = null, deviceInfo = null, recordTime = null;
  try {
    userProfile = getProfile();
    deviceInfo = getDeviceInfo();
    const date = new Date();
    recordTime = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
  } catch (error) {
    logError('sendMetrics', userProfile ? 'device_info' : 'user_profile', `Failed to get ${userProfile ? 'device info' : 'user profile'}`, error);
    return;
  }
  
  // Build request body with safe sensor reads
  // Safely serialize userProfile and deviceInfo to avoid property access errors
  // Use a helper function to safely serialize objects
  function safeSerialize(obj, name) {
    if (obj === null || obj === undefined) {
      return null;
    }
    try {
      // Try to serialize - this will catch circular references and non-serializable values
      return JSON.parse(JSON.stringify(obj));
    } catch (error) {
      logError('sendMetrics', `${name}_serialize`, `Failed to serialize ${name}`, error);
      // Return a safe fallback - just the type/constructor name if available
      try {
        return { _error: 'serialization_failed', _type: obj.constructor ? obj.constructor.name : typeof obj };
      } catch {
        return null;
      }
    }
  }
  
  const reqBody = {
    record_time: recordTime,
    user: safeSerialize(userProfile, 'user_profile'),
    device: safeSerialize(deviceInfo, 'device_info'),
    battery: {
      current: safeSensorGet(battery, 'getCurrent', null),
    },
    blood_oxygen: {
      current: safeSensorGet(bloodOxygen, 'getCurrent', null),
      few_hours: safeSensorGet(bloodOxygen, 'getLastFewHour', null),
      last_day: safeSensorGet(bloodOxygen, 'getLastDay', null),
    },
    body_temperature: {
      current: safeSensorGet(bodyTemperature, 'getCurrent', null),
      today: safeSensorGet(bodyTemperature, 'getToday', null),
    },
    calorie: {
      current: safeSensorGet(calorie, 'getCurrent', null),
      target: safeSensorGet(calorie, 'getTarget', null),
    },
    distance: {
      current: safeSensorGet(distance, 'getCurrent', null),
    },
    fat_burning: {
      current: safeSensorGet(fatBurning, 'getCurrent', null),
      target: safeSensorGet(fatBurning, 'getTarget', null),
    },
    heart_rate: {
      last: safeSensorGet(heartRate, 'getLast', null),
      resting: safeSensorGet(heartRate, 'getResting', null),
      summary: safeSensorGet(heartRate, 'getDailySummary', null),
    },
    pai: {
      day: safeSensorGet(pai, 'getToday', null),
      week: safeSensorGet(pai, 'getTotal', null),
      last_week: safeSensorGet(pai, 'getLastWeek', null),
    },
    sleep: {
      info: safeSensorGet(sleep, 'getInfo', 0),
      stg_list: safeSensorGet(sleep, 'getStageConstantObj', 0) ,
      status: safeSensorGet(sleep, 'getSleepingStatus', 0),
      stage: safeSensorGet(sleep, 'getStage', []),
      nap: safeSensorGet(sleep, 'getNap', []),
    },
    stands: {
      current: safeSensorGet(stand, 'getCurrent', null),
      target: safeSensorGet(stand, 'getTarget', null),
    },
    steps: {
      current: safeSensorGet(step, 'getCurrent', null),
      target: safeSensorGet(step, 'getTarget', null),
    },
    stress: {
      current: safeSensorGet(stress, 'getCurrent', null),
      //today: safeSensorGet(stress, 'getToday', null),
      today_by_hour: safeSensorGet(stress, 'getTodayByHour', null),
      last_week: safeSensorGet(stress, 'getLastWeek', null),
      last_week_by_hour: safeSensorGet(stress, 'getLastWeekByHour', null),
    },
    screen: {
      status: safeSensorGet(screen, 'getStatus', null),
      aod_mode: safeSensorGet(screen, 'getAodMode', null),
      light: safeSensorGet(screen, 'getLight', null),
    },
    is_wearing: safeSensorGet(wear, 'getStatus', null),
    workout: {
      status: safeSensorGet(workout, 'getStatus', null),
      history: safeSensorGet(workout, 'getHistory', []),
    },
    last_error: lastError,
  };
  
  console.log(`[${timestamp}] SENDING METRICS TO ${endPoint}...`);
  
  // Safe JSON stringify
  let requestBody = '';
  try {
    requestBody = JSON.stringify(reqBody);
  } catch (error) {
    logError('sendMetrics', 'json_serialize', 'Failed to serialize request body', error);
    return;
  }

  // Wrap httpRequest call in try-catch to prevent service crash
  try {
    vm.httpRequest({
      method: 'POST',
      url: endPoint,
      body: requestBody,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then((result) => {
      const endTimestamp = getTimestamp();
      const endTime = new Date().getTime();
      const duration = endTime - startTime;
      
      // Clear the last error on successful request
      lastError = null;
      
      let statusStr = '';
      try {
        statusStr = JSON.stringify(result);
      } catch (error) {
        statusStr = String(result);
      }
      
      console.log(`[${endTimestamp}] HTTP SUCCESS (${duration}ms): ${statusStr.substring(0, 50)}`);
      
      if (debugging) {
        try {
          notificationMgr.notify({
            title: "Agent Service",
            content: `Success in ${duration}ms`,
            actions: []
          });
        } catch (error) {
          logError('sendMetrics', 'notification', 'Failed to show success notification', error);
        }
      }
    }).catch((error) => {
      const endTimestamp = getTimestamp();
      const endTime = new Date().getTime();
      const duration = endTime - startTime;
      
      logError('sendMetrics', 'http_request', `Request failed after ${duration}ms`, error);
      
      if (debugging) {
        try {
          notificationMgr.notify({
            title: "Agent Service",
            content: `Error: ${error.message || String(error)}`,
            actions: []
          });
        } catch (notifyError) {
          logError('sendMetrics', 'notification', 'Failed to show error notification', notifyError);
        }
      }
    });
  } catch (error) {
    // Catch synchronous errors from httpRequest call itself
    logError('sendMetrics', 'http_request_init', 'Failed to initiate HTTP request', error);
  }
}

// Continuous running service using timeSensor per-minute callback
// Reference: https://docs.zepp.com/docs/guides/framework/device/app-service/
AppService(
  BasePage({
    onInit() {
      console.log("background onInit");
      const initTimestamp = getTimestamp();
      console.log(`[${initTimestamp}] ==========================================`);
      console.log(`[${initTimestamp}] Background service INITIALIZED`);
      
      try {
        console.log(`[${initTimestamp}] Init event: ${JSON.stringify(e)}`);
      } catch (error) {
        logError('onInit', 'init_event', 'Failed to serialize init event', error);
      }
      
      // Create timeSensor per instance (not at module level) to avoid stale callbacks
      let timeSensor = null;
      try {
        timeSensor = new Time();
        // Safely log time sensor info - Time sensor might not have getHours/getMinutes/getSeconds methods
        try {
          const now = new Date();
          console.log(`[${initTimestamp}] Current time: ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`);
        } catch (timeError) {
          // Ignore time logging errors
        }
        console.log(`[${initTimestamp}] System time: ${new Date().toISOString()}`);
      } catch (error) {
        logError('onInit', 'time_sensor', 'Failed to initialize time sensor', error);
        return;
      }
      
      console.log(`[${initTimestamp}] ==========================================`);
      
      // Capture the BasePage instance (this) to use in the callback
      const vm = this;
      
      // Track if this service instance is still alive
        let isAlive = true;
        
      // Use onPerMinute() - this matches the official ZeppOS documentation example
      console.log(`[${initTimestamp}] Registering onPerMinute callback...`);
      timeSensor.onPerMinute(() => {
          // Check if this service instance is still alive before proceeding
          const callbackTimestamp = getTimestamp();
          console.log(`[${callbackTimestamp}] Running sendMetrics()...`);
          // Run every 2 minutes
          //var shouldRun = timeSensor.getMinutes() % 2 == 0;
          //if (!shouldRun && !debugging) {
          //  return; 
          //}
          try {
            // Use captured vm instead of this to ensure we have the BasePage instance
            sendMetrics(vm);
          } catch (error) {
            logError('onPerMinute', 'send_metrics', 'Unexpected error in sendMetrics', error);
          }
      });
    },
    onDestroy() {
      const destroyTimestamp = getTimestamp();
      console.log(`[${destroyTimestamp}] ==========================================`);
      console.log(`[${destroyTimestamp}] Background service DESTROYED`);
      console.log(`[${destroyTimestamp}] System time: ${new Date().toISOString()}`);
      console.log(`[${destroyTimestamp}] ==========================================`);
      
      // Mark this instance as dead to prevent stale callbacks
      if (this._cleanup) {
        this._cleanup();
      }
    }
  })
);
