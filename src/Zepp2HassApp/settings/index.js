AppSettingsPage({
  state: {
    endpoint: null,
    intervalMinutes: null,
    debugMode: null,
  },

  build(props) {
    this.getStorage(props);

    const views = [];
    const context = this;

    // ═══════════════════════════════════════════════════════════════════
    // 🎨 MODERN COLOR PALETTE
    // ═══════════════════════════════════════════════════════════════════
    const colors = {
      primary: '#6366f1',        // Indigo
      primaryDark: '#4f46e5',    // Indigo dark
      accent: '#22d3ee',         // Cyan accent
      success: '#10b981',        // Emerald
      background: '#0f172a',     // Slate 900
      surface: '#1e293b',        // Slate 800
      surfaceLight: '#334155',   // Slate 700
      text: '#f8fafc',           // Slate 50
      textSecondary: '#94a3b8',  // Slate 400
      border: '#475569',         // Slate 600
      inputBg: '#0f172a',        // Slate 900
    };

    // ═══════════════════════════════════════════════════════════════════
    // 🏗️ HELPER: SECTION HEADER
    // ═══════════════════════════════════════════════════════════════════
    function buildSectionHeader(icon, title, subtitle) {
      return View(
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            padding: '8px 20px 12px 20px',
            marginTop: '16px',
          },
        },
        [
          Text(
            {
              style: {
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                color: colors.accent,
                marginBottom: '2px',
              },
            },
            icon + ' ' + title
          ),
          subtitle ? Text(
            {
              style: {
                fontSize: '12px',
                color: colors.textSecondary,
                lineHeight: '16px',
              },
            },
            subtitle
          ) : null,
        ].filter(Boolean)
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🏗️ HELPER: MODERN INPUT FIELD
    // ═══════════════════════════════════════════════════════════════════
    function buildModernInput(label, value, settingsKey, placeholder, icon) {
      return View(
        {
          style: {
            position: 'relative',
            margin: '6px 16px',
            padding: '16px 20px',
            backgroundColor: colors.surface,
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            border: `1px solid ${colors.border}`,
          },
        },
        [
          // Label row
          View(
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                marginBottom: '10px',
              },
            },
            [
              Text(
                {
                  style: {
                    fontSize: '13px',
                    fontWeight: '600',
                    color: colors.text,
                    letterSpacing: '0.3px',
                  },
                },
                (icon ? icon + ' ' : '') + label
              ),
            ]
          ),
          // Value display with edit button
          View(
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.inputBg,
                borderRadius: '12px',
                padding: '12px 16px',
                border: `1px solid ${colors.surfaceLight}`,
              },
            },
            [
              Text(
                {
                  style: {
                    fontSize: '14px',
                    color: value ? colors.textSecondary : '#64748b',
                    flex: '1',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '70%',
                  },
                },
                value || placeholder || 'Not set'
              ),
              View(
                {
                  style: {
                    position: 'relative',
                    backgroundColor: colors.primary,
                    borderRadius: '10px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                  },
                },
                [
                  Text(
                    {
                      style: {
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#fff',
                        letterSpacing: '0.5px',
                      },
                    },
                    'EDIT'
                  ),
                  TextInput({
                    label: '',
                    settingsKey: settingsKey,
                    subStyle: {
                      position: 'absolute',
                      top: '0',
                      left: '0',
                      right: '0',
                      bottom: '0',
                      opacity: '0',
                      width: '100%',
                      height: '100%',
                    },
                  }),
                ]
              ),
            ]
          ),
        ]
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🏗️ HELPER: MODERN TOGGLE ROW
    // ═══════════════════════════════════════════════════════════════════
    function buildModernToggle(label, description, settingsKey, icon) {
      return View(
        {
          style: {
            position: 'relative',
            margin: '6px 16px',
            padding: '18px 20px',
            backgroundColor: colors.surface,
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            border: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
        },
        [
          View(
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                flex: '1',
              },
            },
            [
              Text(
                {
                  style: {
                    fontSize: '14px',
                    fontWeight: '600',
                    color: colors.text,
                    marginBottom: '4px',
                  },
                },
                (icon ? icon + ' ' : '') + label
              ),
              description ? Text(
                {
                  style: {
                    fontSize: '12px',
                    color: colors.textSecondary,
                    lineHeight: '16px',
                  },
                },
                description
              ) : null,
            ].filter(Boolean)
          ),
          Toggle({
            settingsKey: settingsKey,
          }),
        ]
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    // 📱 MAIN LAYOUT
    // ═══════════════════════════════════════════════════════════════════

    // ─────────────────────────────────────────────────────────────────
    // HERO HEADER
    // ─────────────────────────────────────────────────────────────────
    views.push(
      View(
        {
          style: {
            background: `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primary} 50%, #8b5cf6 100%)`,
            padding: '32px 20px 40px 20px',
            textAlign: 'center',
            borderRadius: '0 0 32px 32px',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
            marginBottom: '8px',
          },
        },
        [
          // App Icon placeholder
          View(
            {
              style: {
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                margin: '0 auto 16px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                backdropFilter: 'blur(10px)',
              },
            },
            [
              Text(
                {
                  style: {
                    fontSize: '36px',
                    lineHeight: '72px',
                    textAlign: 'center',
                  },
                },
                '⌚'
              ),
            ]
          ),
          // App Title
          Text(
            {
              style: {
                fontSize: '26px',
                fontWeight: '800',
                color: '#fff',
                letterSpacing: '-0.5px',
                marginBottom: '6px',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              },
            },
            'Zepp2Hass\n'
          ),
          // Subtitle
          Text(
            {
              style: {
                fontSize: '13px',
                fontWeight: '500',
                color: 'rgba(255,255,255,0.8)',
                letterSpacing: '0.5px',
              },
            },
            'Health Data Sync to Home Assistant'
          ),
        ]
      )
    );

    // ─────────────────────────────────────────────────────────────────
    // CONNECTION SECTION
    // ─────────────────────────────────────────────────────────────────
    views.push(buildSectionHeader('🔗', 'CONNECTION', 'Configure your Home Assistant endpoint'));

    views.push(
      buildModernInput(
        'API Endpoint',
        context.state.endpoint,
        'endpoint',
        'https://your-ha.example.com/api/...',
        '🌐'
      )
    );

    // ─────────────────────────────────────────────────────────────────
    // SYNC SECTION
    // ─────────────────────────────────────────────────────────────────
    views.push(buildSectionHeader('🔄', 'SYNC SETTINGS', 'How often data should be synchronized'));

    views.push(
      buildModernInput(
        'Sync Interval',
        context.state.intervalMinutes ? context.state.intervalMinutes + ' minutes' : null,
        'intervalMinutes',
        '1',
        '⏱️'
      )
    );

    // ─────────────────────────────────────────────────────────────────
    // ADVANCED SECTION
    // ─────────────────────────────────────────────────────────────────
    views.push(buildSectionHeader('⚙️', 'ADVANCED', 'Developer and debugging options'));

    views.push(
      buildModernToggle(
        'Debug Mode',
        'Enable detailed logging for troubleshooting',
        'debugMode',
        '🐛'
      )
    );

    // ─────────────────────────────────────────────────────────────────
    // INFO CARD
    // ─────────────────────────────────────────────────────────────────
    views.push(
      View(
        {
          style: {
            margin: '24px 16px 16px 16px',
            padding: '20px',
            backgroundColor: colors.surface,
            borderRadius: '16px',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          },
        },
        [
          View(
            {
              style: {
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              },
            },
            [
              Text(
                {
                  style: {
                    fontSize: '20px',
                    lineHeight: '24px',
                  },
                },
                '💡'
              ),
              View(
                {
                  style: {
                    flex: '1',
                  },
                },
                [
                  Text(
                    {
                      style: {
                        fontSize: '13px',
                        fontWeight: '600',
                        color: colors.text,
                        marginBottom: '6px',
                        display: 'block',
                      },
                    },
                    'How to Apply Settings'
                  ),
                  Text(
                    {
                      style: {
                        fontSize: '12px',
                        color: colors.textSecondary,
                        lineHeight: '18px',
                        display: 'block',
                      },
                      paragraph: 'true',
                    },
                    'After editing your settings, open the Zepp2Hass app on your watch and tap the "Apply Settings" button to save and activate the new configuration.'
                  ),
                ]
              ),
            ]
          ),
        ]
      )
    );

    // ─────────────────────────────────────────────────────────────────
    // FOOTER
    // ─────────────────────────────────────────────────────────────────
    views.push(
      View(
        {
          style: {
            textAlign: 'center',
            padding: '20px 16px 32px 16px',
          },
        },
        [
          Text(
            {
              style: {
                fontSize: '11px',
                color: colors.surfaceLight,
                letterSpacing: '0.5px',
              },
            },
            'Zepp2Hass v1.0 • Made with ❤️'
          ),
        ]
      )
    );

    // ═══════════════════════════════════════════════════════════════════
    // 📦 RETURN MAIN CONTAINER
    // ═══════════════════════════════════════════════════════════════════
    return View(
      {
        style: {
          position: 'relative',
          width: '100%',
          minHeight: '100%',
          backgroundColor: colors.background,
          paddingBottom: '20px',
        },
      },
      views
    );
  },

  getStorage(props) {
    this.state.endpoint = props.settingsStorage.getItem('endpoint') || 'https://mariella.domotica.uk/api/zepp2hass/dav_watch';
    this.state.intervalMinutes = props.settingsStorage.getItem('intervalMinutes') || '1';
    this.state.debugMode = props.settingsStorage.getItem('debugMode') || 'false';
  },
});
