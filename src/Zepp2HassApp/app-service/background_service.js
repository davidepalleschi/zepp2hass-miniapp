import * as notificationMgr from "@zos/notification";
import * as appService from "@zos/app-service";
import { BasePage } from "@zeppos/zml/base-page";
import { HeartRate, Battery, BloodOxygen, BodyTemperature, Calorie, Distance, FatBurning, Pai, Screen, Sleep, Stand, Step, Stress, Wear, Workout } from "@zos/sensor";
import { getProfile } from '@zos/user'
import { getDeviceInfo } from '@zos/device'

// Track the last error that occurred - this is included in the metrics payload
let lastError = null;

// ============================================================================
// SENSOR INITIALIZATION
// ============================================================================
// Initialize sensors once at module scope to avoid memory leaks
// These sensors are used throughout the service lifetime
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
  console.log(`[INIT] Failed to initialize sensors: ${error}`);
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get current timestamp in HH:MM:SS format
 * Used for logging and error tracking
 */
function getTimestamp() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Get current time in HH:MM format for the record_time field
 */
function getRecordTime() {
  const date = new Date();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Log an error and store it in lastError for inclusion in metrics payload
 * All errors are prefixed with [ERR] for easy searching in logs
 * 
 * @param {string} location - Where the error occurred (function name)
 * @param {string} type - Type/category of the error
 * @param {string} message - Human-readable error message
 * @param {Error|null} error - The actual error object (optional)
 */
function logError(location, type, message, error = null) {
  const timestamp = getTimestamp();
  const errorMsg = error ? ` | ${error.message || String(error)}` : '';
  console.log(`[ERR] [${timestamp}] ${location}::${type}: ${message}${errorMsg}`);
  
  // Store error details for inclusion in the metrics payload
  lastError = {
    timestamp: timestamp,
    type: type,
    location: location,
    message: message,
    error: error ? (error.message || String(error)) : null
  };
  
  return lastError;
}

/**
 * Safely read a value from a sensor
 * If the sensor method doesn't exist or throws an error, returns the default value
 * This prevents the entire service from crashing if one sensor fails
 * 
 * @param {Object} sensor - The sensor object to read from
 * @param {string} methodName - Name of the method to call (e.g., 'getCurrent')
 * @param {*} defaultValue - Value to return if the read fails
 * @returns {*} The sensor value or defaultValue if read failed
 */
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

// ============================================================================
// METRICS PAYLOAD BUILDING
// ============================================================================

/**
 * Build the complete metrics payload by reading from all sensors
 * This function collects data from all available sensors and formats it
 * for sending to the server
 * 
 * @returns {Object} The complete metrics payload object
 */
function buildMetricsPayload() {
  // Get user and device information
  let userProfile = null;
  let deviceInfo = null;
  try {
    userProfile = getProfile();
    deviceInfo = getDeviceInfo();
  } catch (error) {
    // Determine which one failed for better error reporting
    const failedItem = userProfile ? 'device info' : 'user profile';
    logError('buildMetricsPayload', 'profile_fetch', `Failed to get ${failedItem}`, error);
    throw error; // Re-throw so caller can handle it
  }

  // Build the complete payload with all sensor data
  const metricsPayload = {
    // Basic information
    record_time: getRecordTime(),
    user: userProfile,
    device: deviceInfo,
    
    // Battery sensor data
    battery: {
      current: safeSensorGet(battery, 'getCurrent', null),
    },
    
    // Blood oxygen sensor data
    blood_oxygen: {
      current: safeSensorGet(bloodOxygen, 'getCurrent', null),
      few_hours: safeSensorGet(bloodOxygen, 'getLastFewHour', null),
      last_day: safeSensorGet(bloodOxygen, 'getLastDay', null),
    },
    
    // Body temperature sensor data
    body_temperature: {
      current: safeSensorGet(bodyTemperature, 'getCurrent', null),
      //today: safeSensorGet(bodyTemperature, 'getToday', null), // Commented out - uncomment if needed
    },
    
    // Calorie sensor data
    calorie: {
      current: safeSensorGet(calorie, 'getCurrent', null),
      target: safeSensorGet(calorie, 'getTarget', null),
    },
    
    // Distance sensor data
    distance: {
      current: safeSensorGet(distance, 'getCurrent', null),
    },
    
    // Fat burning sensor data
    fat_burning: {
      current: safeSensorGet(fatBurning, 'getCurrent', null),
      target: safeSensorGet(fatBurning, 'getTarget', null),
    },
    
    // Heart rate sensor data
    heart_rate: {
      last: safeSensorGet(heartRate, 'getLast', null),
      resting: safeSensorGet(heartRate, 'getResting', null),
      summary: safeSensorGet(heartRate, 'getDailySummary', null),
    },
    
    // PAI (Personal Activity Intelligence) sensor data
    pai: {
      day: safeSensorGet(pai, 'getToday', null),
      week: safeSensorGet(pai, 'getTotal', null),
      last_week: safeSensorGet(pai, 'getLastWeek', null),
    },
    
    // Sleep sensor data
    sleep: {
      info: safeSensorGet(sleep, 'getInfo', 0),
      stg_list: safeSensorGet(sleep, 'getStageConstantObj', 0),
      status: safeSensorGet(sleep, 'getSleepingStatus', 0),
      stage: safeSensorGet(sleep, 'getStage', []),
      nap: safeSensorGet(sleep, 'getNap', []),
    },
    
    // Stand sensor data
    stands: {
      current: safeSensorGet(stand, 'getCurrent', null),
      target: safeSensorGet(stand, 'getTarget', null),
    },
    
    // Step sensor data
    steps: {
      current: safeSensorGet(step, 'getCurrent', null),
      target: safeSensorGet(step, 'getTarget', null),
    },
    
    // Stress sensor data
    stress: {
      current: safeSensorGet(stress, 'getCurrent', null),
      //today: safeSensorGet(stress, 'getToday', null), // Commented out - uncomment if needed
      //today_by_hour: safeSensorGet(stress, 'getTodayByHour', null), // Commented out - uncomment if needed
      last_week: safeSensorGet(stress, 'getLastWeek', null),
      //last_week_by_hour: safeSensorGet(stress, 'getLastWeekByHour', null), // Commented out - uncomment if needed
    },
    
    // Screen sensor data
    screen: {
      status: safeSensorGet(screen, 'getStatus', null),
      aod_mode: safeSensorGet(screen, 'getAodMode', null),
      light: safeSensorGet(screen, 'getLight', null),
    },
    
    // Wear sensor data (whether device is being worn)
    is_wearing: safeSensorGet(wear, 'getStatus', null),
    
    // Workout sensor data
    workout: {
      status: safeSensorGet(workout, 'getStatus', null),
      history: safeSensorGet(workout, 'getHistory', []),
    },
    
    // Include the last error that occurred (if any)
    last_error: lastError,
  };
  
  return metricsPayload;
}

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

/**
 * Show a notification if debugging is enabled
 * This is useful for testing and debugging the service
 * 
 * @param {Object} vm - The service VM object
 * @param {string} content - The notification content to display
 */
function showNotification(vm, content) {
  // Settings come as strings "true" or "false", so we need to compare to string
  if (vm.state.settings['debugMode'] !== 'true') {
    return; // Don't show notifications if debugging is disabled
  }
  
  try {
    notificationMgr.notify({
      title: "Agent Service",
      content: content,
      actions: []
    });
  } catch (error) {
    logError('showNotification', 'notification', 'Failed to show notification', error);
  }
}

// ============================================================================
// HTTP REQUEST HANDLING
// ============================================================================

/**
 * Send metrics data to the server
 * This function builds the payload, serializes it, and sends it via HTTP POST
 * 
 * @param {Object} vm - The service VM object that provides httpRequest
 * @returns {Promise} Promise that resolves when the request completes successfully
 */
function sendMetrics(vm) {
  return new Promise((resolve, reject) => {
    // Step 1: Validate that we have a valid VM with httpRequest method
    if (!vm || !vm.httpRequest || typeof vm.httpRequest !== 'function') {
      logError('sendMetrics', 'invalid_vm', 'Service destroyed or httpRequest unavailable');
      reject(new Error('Invalid VM or httpRequest unavailable'));
      return;
    }

    // Step 2: Verify that critical sensors are initialized
    if (!battery || !heartRate) {
      logError('sendMetrics', 'sensors_unavailable', 'Sensors not initialized properly');
      reject(new Error('Sensors not initialized'));
      return;
    }

    // Step 3: Track when we started the request (for performance logging)
    const startTime = new Date().getTime();
    
    // Step 4: Build the metrics payload
    let metricsPayload;
    try {
      metricsPayload = buildMetricsPayload();
    } catch (error) {
      // If building the payload fails, we can't continue
      logError('sendMetrics', 'payload_build', 'Failed to build metrics payload', error);
      reject(error);
      return;
    }
    console.log('Endpoint is:', vm.state.settings['endpoint']);
    // Step 6: Log that we're about to send
    console.log(`SENDING METRICS TO ${vm.state.settings['endpoint']}...`);
    
    // Step 7: Serialize the payload to JSON
    let requestBody = '';
    try {
      requestBody = JSON.stringify(metricsPayload);
    } catch (error) {
      logError('sendMetrics', 'json_serialize', 'Failed to serialize request body', error);
      reject(error);
      return;
    }

    // Step 8: Make the HTTP POST request
    // Wrap in try-catch to handle any synchronous errors from httpRequest itself
    try {
      const requestOptions = {
        method: 'POST',
        url: vm.state.settings['endpoint'],
        body: requestBody,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      
      vm.httpRequest(requestOptions)
      .then((result) => {
        // Request succeeded - log success and clear any previous errors
        const endTimestamp = getTimestamp();
        const endTime = new Date().getTime();
        const duration = endTime - startTime;
        
        // Clear the last error since we had a successful request
        lastError = null;
        
        // Try to stringify the result for logging, fallback to String() if it fails
        let statusStr = '';
        try {
          statusStr = JSON.stringify(result);
        } catch (error) {
          statusStr = String(result);
        }
        
        // Log the success with duration
        console.log(`[${endTimestamp}] HTTP SUCCESS (${duration}ms): ${statusStr.substring(0, 50)}`);
        
        // Show notification if debugging is enabled
        showNotification(vm, `Success in ${duration}ms`);
        
        // Resolve the promise with the result
        resolve(result);
      })
      .catch((error) => {
        // Request failed - log the error and show notification
        const endTime = new Date().getTime();
        const duration = endTime - startTime;
        
        logError('sendMetrics', 'http_request', `Request failed after ${duration}ms`, error);
        showNotification(vm, `Error: ${error.message || String(error)}`);
        
        // Reject the promise with the error
        reject(error);
      });
    } catch (error) {
      // This catches synchronous errors from the httpRequest call itself
      // (before the promise is returned)
      logError('sendMetrics', 'http_request_init', 'Failed to initiate HTTP request', error);
      reject(error);
    }
  });
}

// ============================================================================
// SERVICE EVENT HANDLERS
// ============================================================================

/**
 * Handle a service event (onInit or onEvent)
 * This function sends metrics and then exits the service
 * 
 * @param {string} eventName - Name of the event ('onInit' or 'onEvent')
 * @param {Object} vm - The service VM object
 */
function handleServiceEvent(eventName, vm) {
  const timestamp = getTimestamp();
  console.log(`[${timestamp}] service ${eventName}()`);
  
  // Send metrics and handle the result
  sendMetrics(vm)
    .then(() => {
      // Success - log and exit
      console.log(`[${getTimestamp()}] Metrics sent successfully, exiting service`);
      appService.exit();
    })
    .catch((error) => {
      // Error - log it and exit anyway (we don't want to keep the service running)
      logError(eventName, 'sendMetrics_failed', 'Failed to send metrics', error);
      appService.exit();
    });
}

// ============================================================================
// APP SERVICE SETUP
// ============================================================================
// This is the entry point for the background service
// The service is triggered by onInit (when service starts) or onEvent (when triggered)

AppService(
  BasePage({
    state: {
      // Local state to store settings
      settings: null,
    },
    /**
     * Called when the service receives an event trigger
     * This happens when the app requests the service to send metrics
     */
    onEvent(e) {
      try {
        handleServiceEvent('onEvent', this);
      } catch (error) {
        // If handleServiceEvent itself throws an error (shouldn't happen, but be safe)
        logError('onEvent', 'service_crash', 'Service crashed in onEvent', error);
        appService.exit();
      }
    },

    /**
     * Called when the service is initialized
     * This happens when the service first starts
     */
    onInit(e) {
      try {
        // Fetch settings from phone first, then send metrics
        this.fetchSettingsFromPhone()
          .then(() => {
            // Settings fetched successfully, now send metrics
            handleServiceEvent('onInit', this);
          })
          .catch((error) => {
            // Settings fetch failed, log it but still try to send metrics
            logError('onInit', 'fetch_settings', 'Failed to fetch settings from phone', error);
            handleServiceEvent('onInit', this);
          });
      } catch (error) {
        // If anything throws synchronously (shouldn't happen, but be safe)
        logError('onInit', 'service_crash', 'Service crashed in onInit', error);
        appService.exit();
      }
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
          console.log('Got settings:', JSON.stringify(result));
          this.state.settings = result;
        })
        .catch((error) => {
          // An error occurred
          console.error('Error fetching settings:', error);
        });
    },
  }),
);
