# Zepp2Hass

A ZeppOS watch app that automatically collects health and fitness data from your smartwatch and sends it to a custom HTTP endpoint. Perfect for integrating with Home Assistant or any data collection system.

## What It Does

Zepp2Hass runs in the background on your watch and sends your health metrics to a server every minute. It collects:

- **Health**: Heart rate, blood oxygen, body temperature, sleep data, stress levels
- **Activity**: Steps, distance, calories, fat burning, PAI (Personal Activity Intelligence), stand count
- **Device**: Battery level, screen status, workout information, wear detection
- **Profile**: User information and device details

## Quick Start

### 1. Install Development Tools

```bash
# Install Node.js (if needed)
# Windows: winget install -e --id Node.js
# macOS: brew install node
# Linux: sudo apt install nodejs npm

# Install ZeppOS Zeus CLI
npm install -g @zeppos/zeus-cli
```

### 2. Enable Developer Mode on Watch

1. Go to `Settings` → `About` on your watch
2. Tap the logo 10 times
3. Developer options will appear

### 3. Configure Endpoint

Edit `src/Zepp2HassApp/app-service/background_service.js` and update the endpoint URL:

```javascript
const endPoint = "https://your-server.com/api/endpoint"
```

### 4. Build and Install

```bash
cd src/Zepp2HassApp
npm install
zeus preview
```

Scan the QR code with the Zepp app on your phone to install on your watch.

### 5. Start the Service

1. Open Zepp2Hass on your watch
2. Tap the button to start the service
3. Grant background service permission
4. The service will start sending data every minute

## Configuration

### Change Collection Interval

Edit `src/Zepp2HassApp/page/index.js` and modify the `repeat_period` value (in minutes):

```javascript
repeat_period: 1,  // Change to desired interval (e.g., 5 for every 5 minutes)
```

### Enable Debug Notifications

Edit `src/Zepp2HassApp/app-service/background_service.js`:

```javascript
const debugging = true;  // Shows notifications for successful/failed requests
```

## Data Format

The app sends POST requests with JSON data containing all collected metrics. Example:

```json
{
  "record_time": "14:30",
  "user": { "age": 30, "height": 1.80, "weight": 75.0, ... },
  "device": { "deviceName": "Amazfit GTR 4", ... },
  "battery": { "current": 85 },
  "heart_rate": { "last": 85, "resting": 65, ... },
  "sleep": { "status": 0, "stage": [...], ... },
  "steps": { "current": 4461, "target": 6000 },
  "stress": { "current": 49, ... },
  ...
}
```

## Troubleshooting

**Service not starting?**
- Check that background service permission is granted
- Ensure the app is allowed in battery/background settings
- Try restarting the service from the app

**Data not being sent?**
- Verify the endpoint URL is correct and accessible
- Check watch has internet connectivity
- Enable debug mode to see notifications
- Check server logs for incoming requests

**Battery drain?**
- Increase the collection interval (default is every minute)
- Ensure watch sleep settings allow background apps

## Requirements

- ZeppOS 4.0+ compatible device (Amazfit GTR 4, GTS 4, etc.)
- Node.js and ZeppOS Zeus CLI for development
- HTTP endpoint to receive POST requests

## License

ISC
