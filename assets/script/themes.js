class ThemeManager {
  constructor() {
    this.currentTheme = "matrix";
    this.themes = {
      matrix: {
        name: "Matrix Green",
        textPrimary: "#00ff00",
        textSecondary: "#00cc00",
        borderColor: "#00ff0088",
        shadowColor: "#00ff0044",
      },
      kali: {
        name: "Kali Blue",
        textPrimary: "#00d9ff",
        textSecondary: "#0099cc",
        borderColor: "#00d9ff88",
        shadowColor: "#00d9ff44",
      },
      ubuntu: {
        name: "Ubuntu Orange",
        textPrimary: "#ff6600",
        textSecondary: "#cc5500",
        borderColor: "#ff660088",
        shadowColor: "#ff660044",
      },
      "neon-purple": {
        name: "Neon Purple",
        textPrimary: "#dd00ff",
        textSecondary: "#aa00cc",
        borderColor: "#dd00ff88",
        shadowColor: "#dd00ff44",
      },
      "hacker-amber": {
        name: "Hacker Amber",
        textPrimary: "#ffbb00",
        textSecondary: "#cc9900",
        borderColor: "#ffbb0088",
        shadowColor: "#ffbb0044",
      },
    };

    this.init();
  }

  init() {
    this.loadTheme();
  }

  loadTheme() {
    chrome.storage.sync.get(["theme"], (result) => {
      if (result.theme && this.themes[result.theme]) {
        this.setTheme(result.theme);
      }
    });
  }

  setTheme(themeName) {
    if (!this.themes[themeName]) {
      console.error(`Theme "${themeName}" not found`);
      return;
    }

    // Remove all theme classes
    Object.keys(this.themes).forEach((theme) => {
      document.body.classList.remove(`theme-${theme}`);
    });

    // Add new theme class
    document.body.classList.add(`theme-${themeName}`);

    // Apply custom properties
    const theme = this.themes[themeName];
    const root = document.documentElement;
    root.style.setProperty("--text-primary", theme.textPrimary);
    root.style.setProperty("--text-secondary", theme.textSecondary);
    root.style.setProperty("--border-color", theme.borderColor);
    root.style.setProperty("--shadow-color", theme.shadowColor);

    // Update matrix canvas colors
    this.updateMatrixColors(theme.textPrimary);

    // Save theme
    this.currentTheme = themeName;
    chrome.storage.sync.set({ theme: themeName });

    // Log theme change
    systemMonitor.addLog(`Theme changed to: ${theme.name}`);
  }

  updateMatrixColors(color) {
    // This will affect the matrix rain on next render
    // The matrix.js will need to read from CSS variables
    const canvas = document.getElementById("matrix-canvas");
    if (canvas) {
      canvas.dataset.color = color;
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getThemeList() {
    return Object.keys(this.themes);
  }

  getThemeInfo(themeName) {
    return this.themes[themeName] || null;
  }

  cycleTheme() {
    const themeList = this.getThemeList();
    const currentIndex = themeList.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themeList.length;
    this.setTheme(themeList[nextIndex]);
    return themeList[nextIndex];
  }

  applyCustomColors(primary, secondary) {
    const root = document.documentElement;
    root.style.setProperty("--text-primary", primary);
    root.style.setProperty("--text-secondary", secondary);
    root.style.setProperty("--border-color", primary + "88");
    root.style.setProperty("--shadow-color", primary + "44");

    systemMonitor.addLog("Custom colors applied");
  }

  resetToDefault() {
    this.setTheme("matrix");
  }

  exportTheme() {
    const theme = this.themes[this.currentTheme];
    return JSON.stringify(theme, null, 2);
  }

  importTheme(themeJson) {
    try {
      const theme = JSON.parse(themeJson);
      if (theme.textPrimary && theme.textSecondary) {
        this.applyCustomColors(theme.textPrimary, theme.textSecondary);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Theme import error:", error);
      return false;
    }
  }

  getThemePreview(themeName) {
    const theme = this.themes[themeName];
    if (!theme) return null;

    return {
      name: theme.name,
      colors: {
        primary: theme.textPrimary,
        secondary: theme.textSecondary,
        border: theme.borderColor,
        shadow: theme.shadowColor,
      },
    };
  }

  generateRandomTheme() {
    const randomColor = () => {
      const colors = [
        "#00ff00",
        "#00ffff",
        "#ff00ff",
        "#ffff00",
        "#ff6600",
        "#00ff88",
        "#8800ff",
        "#ff0088",
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    const primary = randomColor();
    const secondary = this.adjustBrightness(primary, -20);

    this.applyCustomColors(primary, secondary);
    systemMonitor.addLog("Random theme generated");
  }

  adjustBrightness(hex, percent) {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;

    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }

  getDarkModeStatus() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  autoTheme() {
    const isDark = this.getDarkModeStatus();
    if (isDark) {
      this.setTheme("matrix");
    } else {
      this.setTheme("ubuntu");
    }
    systemMonitor.addLog("Auto theme applied");
  }
}

// Initialize theme manager
const themeManager = new ThemeManager();
