// import { AppSettingsPage } from '@zos/settings';
// import { Section, TextInput, Toggle, Text } from '@zos/settings-ui';

AppSettingsPage({
  // 1. Define state
  state: {
    endpoint: null,
    intervalMinutes: null,
    debugMode: null,
  },

  build(props) {
    // 2. Get SettingsStorage
    this.getStorage(props);

    // 3. Logic
    // (no special logic needed here)

    // 4. Return Render Function
    return Section({}, [
      Section(
        {},
        TextInput({
          label: 'Endpoint URL',
          placeholder: 'https://your-server.com/api/endpoint',
          settingsKey: 'endpoint',
        })
      ),
      Section(
        {},
        TextInput({
          label: 'Interval (minutes)',
          placeholder: '1',
          settingsKey: 'intervalMinutes',
        })
      ),
      Section(
        {},
        Toggle({
          label: 'Debug Mode',
          settingsKey: 'debugMode',
        })
      ),
      Section(
        {},
        TextInput({
          label: 'HTTP Timeout (seconds)',
          placeholder: '30',
          settingsKey: 'httpTimeout',
        })
      ),
      Section(
        {},
        Text({
          content: 'Settings are saved automatically. Restart the service for changes to take effect.',
        })
      ),
    ]);
  },

  getStorage(props) {
    // Load values from settingsStorage with defaults
    this.state.endpoint = props.settingsStorage.getItem('endpoint') || 'https://mariella.domotica.uk/api/zepp2hass/dav_watch';
    this.state.intervalMinutes = props.settingsStorage.getItem('intervalMinutes') || '1';
    this.state.debugMode = props.settingsStorage.getItem('debugMode') || 'false';
    this.state.httpTimeout = props.settingsStorage.getItem('httpTimeout') || '30';
  },
});

