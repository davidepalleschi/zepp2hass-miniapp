import { BaseSideService } from "@zeppos/zml/base-side";

AppSideService(
  BaseSideService({
    onInit() {
      console.log('app side service invoke onInit')
    },

    /**
     * Called when settings change
     */
    onSettingsChange({ key, newValue, oldValue }) {
      console.log(`app-side onSettingsChange`);
      console.log(`app-side inputValue = ${key}(${oldValue}, ${newValue})`);
      
      // if (key == 'data') {
      //   console.log(`app-side dataOld = ${oldValue}, dataNew = ${newValue}`);
      //   try {
      //     let data = JSON.parse(newValue);
      //     console.log(`app-side data = ${JSON.stringify(data)}`);
      //     if (data.latitude != undefined && data.latitude != null && data.latitude != 0) {
      //       settings.settingsStorage.setItem('latitude', data.latitude);
      //     }
      //     if (data.longitude != undefined && data.longitude != null && data.longitude != 0) {
      //       settings.settingsStorage.setItem('longitude', data.longitude);
      //     }
      //     settings.settingsStorage.setItem('data', '{}');
      //   } catch (e) {
      //     console.log(`app-side error parsing data: ${e}`);
      //   }
      // }
      
      // Notify the watch about the settings change
      this.call({
        result: {
          key: key,
          oldValue: oldValue,
          newValue: newValue
        }
      });
    },

    /**
     * When the watch requests data, this is triggered.
     */
    onRequest(req, res) {
      console.log(`app-side onRequest.method = ${req.method}`);
      if (req.method === 'GET_settings') {
        try {
          let result = {
            endpoint: settings.settingsStorage.getItem('endpoint') || '',
            intervalMinutes: settings.settingsStorage.getItem('intervalMinutes') || 0,
            debugMode: settings.settingsStorage.getItem('debugMode') || 0,
          };
          console.log(`app-side GET_settings result = ${JSON.stringify(result)}`);
          res(null, result);
        } catch (e) {
          res({
            status: 'error',
            message: 'Failed to get settings',
          });
        }
      }
    },
    
    onRun() {
        console.log('app side service invoke onRun')
    },
    onDestroy() {
        console.log('app side service invoke onDestroy')
    },
  }),
)