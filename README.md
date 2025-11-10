# Zepp2Hass

A ZeppOS watch app that collects health and fitness metrics from your smartwatch and sends them to a custom HTTP endpoint. Perfect for integrating watch data with Home Assistant, custom dashboards, or data analysis systems.

## Features

- **Comprehensive Health Metrics**: Collects data from multiple sensors including:
  - Heart rate (current, resting, daily summary)
  - Blood oxygen (current, last few hours, last day)
  - Body temperature (current, today)
  - Sleep data (info, stages, status, naps)
  - Steps, distance, calories, fat burning
  - Stress levels (current, today by hour, last week)
  - PAI (Personal Activity Intelligence)
  - Stand count
  - Workout status and history
  - Battery level
  - Screen status and AOD mode
  - Wear detection

- **Background Service**: Runs continuously in the background, sending metrics every minute
- **Simple UI**: Easy start/stop control for the background service
- **Error Handling**: Robust error handling with detailed logging
- **ZeppOS Compatible**: Built for ZeppOS 3.0.0+ (Amazfit GTR 4 and compatible devices)

## Project Structure

```
sleepagent/
├── src/
│   └── Zepp2HassApp/            # Main ZeppOS application
│       ├── app.json            # App configuration
│       ├── app.js              # App entry point
│       ├── app-side/           # App-side service
│       ├── app-service/        # Background service
│       │   └── background_service.js  # Main metrics collection service
│       ├── page/               # UI pages
│       │   └── index.js        # Main page with start/stop controls
│       ├── assets/             # App icons
│       └── package.json        # Dependencies
├── assets/                     # Documentation images
└── README.md                   # This file
```

## Requirements

- **Hardware**: Amazfit GTR 4 or compatible ZeppOS 3.0+ device
- **Development**: 
  - Node.js and npm
  - ZeppOS Zeus CLI tool
- **Server**: HTTP endpoint to receive POST requests (optional, can use existing services)

## Installation

### Step 1: Enable Developer Mode

1. On your watch, go to `Settings` → `About`
2. Tap the logo 10 times to enable developer mode
3. You should see developer options appear

![Enable developer mode](./assets/dev.png)

### Step 2: Install Development Tools

Install Node.js and the ZeppOS Zeus CLI:

```bash
# Install Node.js (if not already installed)
# On Windows:
winget install -e --id Node.js

# On macOS:
brew install node

# On Linux:
sudo apt install nodejs npm

# Install ZeppOS Zeus CLI globally
npm i @zeppos/zeus-cli -g
```

### Step 3: Configure Endpoint

Edit the endpoint URL in the background service file:

```bash
# Open the background service file
nano src/Zepp2HassApp/app-service/background_service.js
```

Find and update the `endPoint` constant (around line 9):

```javascript
const endPoint = "https://your-server.com/api/endpoint"
```

**Current default**: `https://mariella.domotica.uk/api/zepp2hass/dav_watch` (Home Assistant integration)

### Step 4: Build the App

```bash
cd src/Zepp2HassApp
npm install
zeus preview
```

This will generate a QR code that you can scan with the Zepp app on your phone.

![QR Code](./assets/qr.png)

### Step 5: Install on Watch

1. Open the Zepp app on your phone
2. Scan the QR code displayed in the terminal
3. The app will be installed on your watch

![Install app](./assets/install.jpg)

### Step 6: Start the Service

1. Open the Zepp2Hass app on your watch
2. Tap "Start Service" button
3. Grant background service permission when prompted
4. The service will start running and send metrics every minute

![App running](./assets/running.png)

## Data Format

The app sends a POST request to your configured endpoint with the following JSON structure:

```json
{
  "record_time": "14:30",
  "user": {
    "age": 30,
    "height": 1.80,
    "weight": 75.0,
    "gender": 0,
    "nickName": "UserName",
    "region": "cn",
    "birth": {
      "year": 1990,
      "month": 1,
      "day": 1
    }
  },
  "device": {
    "width": 466,
    "height": 466,
    "screenShape": 1,
    "deviceName": "Amazfit GTR 4",
    "keyNumber": 2,
    "keyType": "normal_21",
    "deviceSource": 7930222,
    "deviceColor": 3,
    "productId": 121,
    "productVer": 256,
    "skuId": 256
  },
  "battery": {
    "current": 85
  },
  "blood_oxygen": {
    "current": 97,
    "few_hours": [...],
    "last_day": [...]
  },
  "body_temperature": {
    "current": 36.5,
    "today": [...]
  },
  "calorie": {
    "current": 247,
    "target": 800
  },
  "distance": {
    "current": 3391
  },
  "fat_burning": {
    "current": 39,
    "target": 30
  },
  "heart_rate": {
    "last": 85,
    "resting": 65,
    "summary": {
      "maximum": {
        "time": 1708437033,
        "time_zone": 0,
        "hr_value": 154
      }
    }
  },
  "pai": {
    "day": 2,
    "week": 155,
    "last_week": 120
  },
  "sleep": {
    "info": {...},
    "stg_list": {...},
    "status": 0,
    "stage": [...],
    "nap": [...]
  },
  "stands": {
    "current": 5,
    "target": 12
  },
  "steps": {
    "current": 4461,
    "target": 6000
  },
  "stress": {
    "current": 49,
    "today_by_hour": [...],
    "last_week": [...],
    "last_week_by_hour": [...]
  },
  "screen": {
    "status": 1,
    "aod_mode": 0,
    "light": 50
  },
  "is_wearing": 1,
  "workout": {
    "status": 0,
    "history": [...]
  },
  "last_error": null
}
```

## Configuration

### Update Collection Interval

By default, metrics are sent every minute. To change this, edit `src/Zepp2HassApp/app-service/background_service.js`:

```javascript
timeSensor.onPerMinute(() => {
  // Modify the condition to change frequency
  // Example: Run every 5 minutes
  const shouldRun = timeSensor.getMinutes() % 5 === 0;
  if (!shouldRun) return;
  
  sendMetrics(vm);
});
```

### Enable Debug Notifications

Set `debugging = true` in `background_service.js` to show notifications for successful/failed requests:

```javascript
const debugging = true;
```

### Permissions

The app requires the following permissions (configured in `app.json`):

- Device storage access
- Health data access (heart rate, SpO2, body temp, sleep, etc.)
- Background service
- Notifications
- Alarm

## Troubleshooting

### Service Not Running

1. Check that background service permission is granted
2. Ensure the app is allowed to run in background (watch Settings → Battery → Background Apps)
3. Try restarting the service from the app UI

### Data Not Being Sent

1. Check the endpoint URL is correct and accessible
2. Verify your server is receiving requests (check server logs)
3. Enable debug mode to see notifications
4. Check watch logs using ZeppOS developer tools

### Battery Drain

- The app sends data every minute by default, which may impact battery life
- Consider increasing the interval if battery is a concern
- Ensure watch sleep mode settings allow background apps

## Development

### Project Dependencies

- `@zeppos/zml`: ^0.0.23 - ZeppOS framework
- `@zeppos/device-types`: ^3.0.0 - Device type definitions

### Building

```bash
cd src/Zepp2HassApp
npm install
zeus build
```

### Preview

```bash
zeus preview
```

### Debugging

Use the ZeppOS developer tools to view console logs and debug the app.

## API Reference

The app uses ZeppOS 3.0.0 APIs:

- Sensor APIs: `@zos/sensor` (HeartRate, Battery, BloodOxygen, Sleep, etc.)
- User API: `@zos/user` (getProfile)
- Device API: `@zos/device` (getDeviceInfo)
- HTTP API: `httpRequest` for sending data
- Background Service: `@zos/app-service` for continuous operation

See [ZeppOS Documentation](https://docs.zepp.com/) for full API reference.

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Support

For issues, questions, or feature requests, please open an issue on the project repository.
