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

    // 3. Build views array
    const views = [];
    const context = this;

    // Helper function to build styled layout
    function buildLayout(text, value, settingsKey) {
      const label = Text(
            {
              style: {
                marginLeft: "15px",
                paddingRight: "15px",
                whiteSpace: "nowrap",
                flexShrink: "0",
              },
              align: "left",
            },
            text
          ),
          valueText = Text(
            {
              style: {
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                flexGrow: 1,
                textAlign: "right",
                paddingRight: "10px",
              },
              align: "right",
            },
            value
          ),
          view = View(
            {
              style: {
                overflow: "hidden",
                position: "absolute",
                top: "10px",
                right: "5px",
                background: "#3443dc",
                color: "white",
                fontSize: "15px",
                lineHeight: "30px",
                borderRadius: "30px",
                textAlign: "center",
                padding: "0 15px",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              },
            },
            [
              TextInput({
                label: "Edit",
                settingsKey: settingsKey,
                subStyle: {
                  top: "0px",
                  right: "0px",
                  background: "#3443dc",
                  color: "#3443dc",
                  fontSize: "0px",
                  lineHeight: "1px",
                  borderRadius: "30px",
                  textAlign: "center",
                  padding: "0px",
                },
              }),
            ]
          );
      return View(
        {
          style: {
            position: "relative",
            marginTop: "5px",
            height: "50px",
            fontSize: "20px",
            lineHeight: "50px",
            color: "#333",
            backgroundColor: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingRight: "65px",
          },
        },
        [label, valueText, view]
      );
    }

    // Helper function to create divider
    function buildDivider() {
      return View(
        {
          style: {
            overflow: "hidden",
            top: "10px",
            right: "5px",
            background: "#3443dc",
            color: "white",
            fontSize: "12px",
            lineHeight: "30px",
            padding: "0 15px",
            minHeight: "2px",
            marginBottom: "15px",
          },
        },
        []
      );
    }

    // Title section
    views.push(
      View(
        {
          style: {
            textAlign: "center",
            padding: "0 15px",
            marginTop: "15px",
            marginBottom: "15px",
          },
        },
        [
          Text(
            {
              align: "center",
              style: {
                textAlign: "center",
                fontSize: "24px",
                fontWeight: "bold",
                color: "#3443dc",
              },
            },
            "Zepp2Hass Settings"
          ),
        ]
      )
    );

    // Endpoint URL
    views.push(
      buildLayout(
        "Endpoint URL",
        context.state.endpoint,
        "endpoint"
      )
    );

    // Interval (minutes)
    views.push(
      buildLayout(
        "Interval (minutes)",
        context.state.intervalMinutes,
        "intervalMinutes"
      )
    );

    // Divider
    views.push(buildDivider());

    // Debug Mode section
    views.push(
      View(
        {
          style: {
            position: "relative",
            marginTop: "5px",
            height: "50px",
            fontSize: "20px",
            lineHeight: "50px",
            color: "#333",
            backgroundColor: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 15px",
          },
        },
        [
          Text(
            {
              style: {
                marginLeft: "15px",
              },
            },
            "Debug Mode"
          ),
          Toggle({
            settingsKey: "debugMode",
          }),
        ]
      )
    );

    // Divider
    views.push(buildDivider());

    // Info section
    views.push(
      View(
        {
          style: {
            textAlign: "center",
            padding: "0 15px",
            marginTop: "15px",
            marginBottom: "15px",
          },
        },
        [
          Text(
            {
              style: {
                textAlign: "center",
                display: "block",
                fontSize: "14px",
                color: "#666",
              },
              paragraph: "true",
            },
            "Settings are saved automatically. The app will sync health and fitness data to your endpoint at the specified interval."
          ),
        ]
      )
    );

    // 4. Return the main view with all components
    return View(
      {
        style: {
          overflow: "hidden",
          position: "relative",
          width: "100%",
          height: "100%",
          backgroundColor: "#EDEDED",
          display: "block",
        },
      },
      views
    );
  },

  getStorage(props) {
    // Load values from settingsStorage with defaults
    this.state.endpoint = props.settingsStorage.getItem('endpoint') || 'https://mariella.domotica.uk/api/zepp2hass/dav_watch';
    this.state.intervalMinutes = props.settingsStorage.getItem('intervalMinutes') || '1';
    this.state.debugMode = props.settingsStorage.getItem('debugMode') || 'false';
  },
});

