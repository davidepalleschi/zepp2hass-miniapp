import * as notificationMgr from "@zos/notification";
import * as appService from "@zos/app-service";
import { BasePage } from "@zeppos/zml/base-page";
import { HeartRate, Battery, BloodOxygen, BodyTemperature, Calorie, Distance, FatBurning, Pai, Screen, Sleep, Stand, Step, Stress, Wear, Workout } from "@zos/sensor";
import { getProfile } from '@zos/user'
import { getDeviceInfo } from '@zos/device'
import { localStorage } from "@zos/storage";

// Storage key for statistics (must match the one in page/index.js)
const STORAGE_KEY_STATS = "zepp2hass_stats";

// Track the last error that occurred - this is included in the metrics payload
let lastError = null;

// Track service lifecycle state for debugging
let serviceState = {
  initTime: null,
  lastEventTime: null,
  httpRequestPending: false,
  httpRequestStartTime: null,
  destroyReason: null
};

// ============================================================================
// SENSOR INITIALIZATION
// ============================================================================
// Initialize sensors once at module scope to avoid memory leaks
// These sensors are used throughout the service lifetime
let battery, bloodOxygen, bodyTemperature, calorie, distance, fatBurning, heartRate, pai, screen, sleep, stand, step, stress, wear, workout;

const moduleLoadTime = new Date();
console.log(`[LOG] [${moduleLoadTime.toISOString()}] [MODULE] background_service.js module loading...`);

try {
  console.log(`[LOG] [MODULE] Initializing sensors...`);
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
  console.log(`[LOG] [MODULE] All sensors initialized successfully`);
} catch (error) {
  console.log(`[LOG] [MODULE] FAILED to initialize sensors: ${error?.message || String(error)}`);
  // Store this as the first error
  lastError = {
    timestamp: moduleLoadTime.toISOString(),
    type: 'sensor_init',
    location: 'module_load',
    message: 'Failed to initialize sensors',
    error: error?.message || String(error)
  };
}
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get current timestamp in HH:MM:SS.mmm format (with milliseconds)
 * Used for logging and error tracking
 */
function getTimestamp() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Enhanced logging function with consistent format
 * All logs are prefixed with [LOG] for easy filtering
 */
function log(tag, message, data = null) {
  const timestamp = getTimestamp();
  const dataStr = data !== null ? ` | ${typeof data === 'object' ? JSON.stringify(data) : data}` : '';
  console.log(`[LOG] [${timestamp}] [${tag}] ${message}${dataStr}`);
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

// ============================================================================
// STATISTICS MANAGEMENT
// ============================================================================

/**
 * Load statistics from local storage
 * @returns {Object} Statistics object with default values if not found
 */
function loadStats() {
  try {
    const statsJson = localStorage.getItem(STORAGE_KEY_STATS);
    if (statsJson) {
      const parsed = JSON.parse(statsJson);
      // Ensure lastError field exists
      if (parsed.lastError === undefined) {
        parsed.lastError = null;
      }
      return parsed;
    }
  } catch (error) {
    log('STATS', 'Error loading stats', { error: error?.message || String(error) });
  }
  // Return default stats if not found or error
  return {
    successCount: 0,
    errorCount: 0,
    lastSyncTime: null,
    lastStatus: "unknown",
    lastError: null,
  };
}

/**
 * Save statistics to local storage
 * @param {Object} stats - Statistics object to save
 */
function saveStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    log('STATS', 'Stats saved successfully', stats);
  } catch (error) {
    log('STATS', 'Error saving stats', { error: error?.message || String(error) });
  }
}

/**
 * Update statistics after a request completes
 * @param {boolean} success - Whether the request was successful
 * @param {string|null} errorMessage - Error message if failed
 */
function updateStats(success, errorMessage = null) {
  const stats = loadStats();
  const timestamp = getRecordTime();
  
  if (success) {
    stats.successCount++;
    stats.lastStatus = "success";
    stats.lastError = null; // Clear error on success
  } else {
    stats.errorCount++;
    stats.lastStatus = "error";
    stats.lastError = errorMessage || "Unknown error";
  }
  stats.lastSyncTime = timestamp;
  
  saveStats(stats);
  return stats;
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
      const errMsg = 'Service destroyed or httpRequest unavailable';
      logError('sendMetrics', 'invalid_vm', errMsg);
      updateStats(false, errMsg);
      reject(new Error(errMsg));
      return;
    }

    // Step 2: Verify that critical sensors are initialized
    if (!battery || !heartRate) {
      const errMsg = 'Sensors not initialized';
      logError('sendMetrics', 'sensors_unavailable', errMsg);
      updateStats(false, errMsg);
      reject(new Error(errMsg));
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
      const errMsg = error?.message || 'Failed to build payload';
      logError('sendMetrics', 'payload_build', 'Failed to build metrics payload', error);
      updateStats(false, errMsg);
      reject(error);
      return;
    }
    
    // Check if endpoint is configured
    const endpoint = vm.state.settings ? vm.state.settings['endpoint'] : null;
    if (!endpoint) {
      const errMsg = 'No endpoint configured';
      logError('sendMetrics', 'no_endpoint', errMsg);
      updateStats(false, errMsg);
      reject(new Error(errMsg));
      return;
    }
    
    log('HTTP', `Endpoint configured: ${endpoint}`);
    log('HTTP', `SENDING METRICS TO ${endpoint}...`);
    
    // Step 7: Serialize the payload to JSON
    let requestBody = '';
    try {
      requestBody = JSON.stringify(metricsPayload);
      log('HTTP', `Payload serialized successfully`, { size: requestBody.length, hasLastError: !!metricsPayload.last_error });
    } catch (error) {
      const errMsg = error?.message || 'JSON serialize failed';
      logError('sendMetrics', 'json_serialize', 'Failed to serialize request body', error);
      updateStats(false, errMsg);
      reject(error);
      return;
    }

    // Step 8: Make the HTTP POST request
    // Wrap in try-catch to handle any synchronous errors from httpRequest itself
    try {
      const requestOptions = {
        method: 'POST',
        url: endpoint,
        body: requestBody,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      // Track that we have a pending HTTP request
      serviceState.httpRequestPending = true;
      serviceState.httpRequestStartTime = startTime;
      
      log('HTTP', 'Calling vm.httpRequest() NOW...');
      
      // Create a timeout promise to detect hung requests
      const HTTP_TIMEOUT_MS = 30000; // 30 seconds timeout
      let timeoutId = null;
      const timeoutPromise = new Promise((_, timeoutReject) => {
        timeoutId = setTimeout(() => {
          log('HTTP', `REQUEST TIMEOUT after ${HTTP_TIMEOUT_MS}ms - no response received`);
          logError('sendMetrics', 'http_timeout', `Request timed out after ${HTTP_TIMEOUT_MS}ms`);
          timeoutReject(new Error(`HTTP request timed out after ${HTTP_TIMEOUT_MS}ms`));
        }, HTTP_TIMEOUT_MS);
      });
      
      const httpPromise = vm.httpRequest(requestOptions);
      
      log('HTTP', 'httpRequest() called - promise created, waiting for response...');
      
      // Race between the actual request and the timeout
      Promise.race([httpPromise, timeoutPromise])
      .then((result) => {
        // Clear the timeout since we got a response
        if (timeoutId) clearTimeout(timeoutId);
        
        // Request succeeded - log success and clear any previous errors
        const endTimestamp = getTimestamp();
        const endTime = new Date().getTime();
        const duration = endTime - startTime;
        
        // Update service state
        serviceState.httpRequestPending = false;
        serviceState.httpRequestStartTime = null;
        
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
        log('HTTP', `SUCCESS after ${duration}ms`, { response: statusStr.substring(0, 100) });
        
        // Update statistics
        updateStats(true);
        
        // Show notification if debugging is enabled
        showNotification(vm, `Success in ${duration}ms`);
        
        // Resolve the promise with the result
        resolve(result);
      })
      .catch((error) => {
        // Clear the timeout
        if (timeoutId) clearTimeout(timeoutId);
        
        // Request failed - log the error and show notification
        const endTime = new Date().getTime();
        const duration = endTime - startTime;
        
        // Update service state
        serviceState.httpRequestPending = false;
        serviceState.httpRequestStartTime = null;
        
        const errorStr = error ? (error.message || String(error)) : 'Unknown error';
        log('HTTP', `FAILED after ${duration}ms`, { error: errorStr });
        logError('sendMetrics', 'http_request', `Request failed after ${duration}ms`, error);
        
        // Update statistics with error message
        updateStats(false, errorStr);
        
        showNotification(vm, `Error: ${errorStr}`);
        
        // Reject the promise with the error
        reject(error);
      });
    } catch (error) {
      // This catches synchronous errors from the httpRequest call itself
      // (before the promise is returned)
      serviceState.httpRequestPending = false;
      const errMsg = error?.message || String(error) || 'HTTP request init failed';
      log('HTTP', 'SYNC ERROR - httpRequest() threw synchronously', { error: errMsg });
      logError('sendMetrics', 'http_request_init', 'Failed to initiate HTTP request', error);
      updateStats(false, errMsg);
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
  serviceState.lastEventTime = new Date().getTime();
  
  log('SERVICE', `=== ${eventName}() START ===`);
  log('SERVICE', `Service state`, { 
    initTime: serviceState.initTime,
    httpPending: serviceState.httpRequestPending 
  });
  
  // Send metrics and handle the result
  sendMetrics(vm)
    .then(() => {
      // Success - log and exit
      log('SERVICE', `Metrics sent successfully, calling appService.exit()`);
      appService.exit();
    })
    .catch((error) => {
      // Error - log it and exit anyway (we don't want to keep the service running)
      log('SERVICE', `Metrics FAILED, calling appService.exit() anyway`, { error: error?.message || String(error) });
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
      log('LIFECYCLE', '>>> onEvent() triggered', { event: e });
      try {
        handleServiceEvent('onEvent', this);
      } catch (error) {
        // If handleServiceEvent itself throws an error (shouldn't happen, but be safe)
        const errorMsg = error?.message || String(error);
        log('LIFECYCLE', 'CRASH in onEvent()', { error: errorMsg });
        logError('onEvent', 'service_crash', 'Service crashed in onEvent', error);
        updateStats(false, `Crash: ${errorMsg}`);
        appService.exit();
      }
    },

    /**
     * Called when the service is initialized
     * This happens when the service first starts
     */
    onInit(e) {
      serviceState.initTime = new Date().getTime();
      log('LIFECYCLE', '>>> onInit() called - SERVICE STARTING', { event: e });
      log('LIFECYCLE', `Sensors initialized: battery=${!!battery}, heartRate=${!!heartRate}`);
      
      try {
        log('LIFECYCLE', 'Fetching settings from phone...');
        // Fetch settings from phone first, then send metrics
        this.fetchSettingsFromPhone()
          .then(() => {
            // Settings fetched successfully, now send metrics
            log('LIFECYCLE', 'Settings fetched, proceeding to send metrics');
            handleServiceEvent('onInit', this);
          })
          .catch((error) => {
            // Settings fetch failed, log it but still try to send metrics
            log('LIFECYCLE', 'Settings fetch FAILED, will try with defaults', { error: error?.message || String(error) });
            logError('onInit', 'fetch_settings', 'Failed to fetch settings from phone', error);
            handleServiceEvent('onInit', this);
          });
      } catch (error) {
        // If anything throws synchronously (shouldn't happen, but be safe)
        const errorMsg = error?.message || String(error);
        log('LIFECYCLE', 'SYNC CRASH in onInit()', { error: errorMsg });
        logError('onInit', 'service_crash', 'Service crashed in onInit', error);
        updateStats(false, `Init crash: ${errorMsg}`);
        appService.exit();
      }
    },
    
    /**
     * Called when the service is being destroyed
     * This is CRITICAL for debugging - logs why/when the service dies
     */
    onDestroy() {
      const now = new Date().getTime();
      const uptimeMs = serviceState.initTime ? (now - serviceState.initTime) : 'unknown';
      const httpPendingDuration = serviceState.httpRequestStartTime ? (now - serviceState.httpRequestStartTime) : null;
      
      log('LIFECYCLE', '!!! onDestroy() called - SERVICE BEING DESTROYED !!!');
      log('LIFECYCLE', `Service uptime: ${uptimeMs}ms`);
      log('LIFECYCLE', `HTTP request was pending: ${serviceState.httpRequestPending}`);
      if (httpPendingDuration !== null) {
        log('LIFECYCLE', `HTTP request pending for: ${httpPendingDuration}ms before destroy`);
      }
      log('LIFECYCLE', `Last error at destroy time`, lastError);
      
      // If we had a pending HTTP request when destroyed, this is the smoking gun!
      if (serviceState.httpRequestPending) {
        console.log(`[CRITICAL] SERVICE DESTROYED WITH PENDING HTTP REQUEST! This explains missing metrics!`);
        console.log(`[CRITICAL] HTTP request started ${httpPendingDuration}ms ago and never completed`);
      }
    },
    
    fetchSettingsFromPhone() {
      log('SETTINGS', 'Requesting settings via this.request()...');
      return this.request({
        // This 'method' name must match the one in your app-side-service
        method: 'GET_settings',
        params: {
          // You can send any parameters here if needed
        },
      })
        .then((result) => {
          // Successfully received settings from the phone
          log('SETTINGS', 'Got settings from phone', result);
          this.state.settings = result;
        })
        .catch((error) => {
          // An error occurred
          log('SETTINGS', 'ERROR fetching settings', { error: error?.message || String(error) });
          throw error; // Re-throw so caller knows it failed
        });
    },
  }),
);
