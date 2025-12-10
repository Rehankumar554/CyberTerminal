# 📦 Installation Guide

Complete installation instructions for CyberTerminal Chrome Extension.

---

## 📋 Table of Contents

- [Requirements](#requirements)
- [Installation Methods](#installation-methods)
- [Configuration](#configuration)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Uninstallation](#uninstallation)

---

## ✅ Requirements

### Minimum Requirements

- **Browser**: Google Chrome 90+ or Chromium-based browser
- **OS**: Windows 10+, macOS 10.13+, or Linux
- **Storage**: ~5 MB free space
- **Internet**: Required for API features (weather, crypto)

### Recommended

- **Browser**: Google Chrome 120+ (latest version)
- **RAM**: 4 GB or more
- **Display**: 1366x768 or higher resolution

---

## 📥 Installation Methods

### Method 1: Load Unpacked (Recommended for Development)

Perfect for developers, testers, or anyone who wants the latest features.

#### Step 1: Download the Extension

**Option A: Download ZIP**

1. Go to [GitHub Repository](https://github.com/rehankumar554/cyberterminal)
2. Click green "Code" button
3. Select "Download ZIP"
4. Extract ZIP to a permanent location (e.g., `Documents/cyberterminal`)

**Option B: Git Clone**

```bash
# Open terminal/command prompt
git clone https://github.com/rehankumar554/cyberterminal.git
cd cyberterminal
```

#### Step 2: Open Chrome Extensions

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
   - Or: Menu → More Tools → Extensions
   - Or: Press `Ctrl+Shift+E` (Windows/Linux) or `Cmd+Shift+E` (Mac)

#### Step 3: Enable Developer Mode

1. Look for "Developer mode" toggle in top-right corner
2. Click to enable it
3. New buttons will appear

#### Step 4: Load the Extension

1. Click "Load unpacked" button
2. Navigate to the `cyberterminal` folder
3. Select the folder (not individual files)
4. Click "Select Folder" or "Open"

#### Step 5: Verify Installation

1. Extension should appear in your extensions list
2. Icon will show in Chrome toolbar (if enabled)
3. Open a new tab to see CyberTerminal

---

### Method 2: Chrome Web Store (Coming Soon)

Future release method - easiest for end users.

#### When Available:

1. Visit [Chrome Web Store](https://chrome.google.com/webstore)
2. Search for "CyberTerminal"
3. Click "Add to Chrome"
4. Confirm installation
5. Open new tab to use

---

### Method 3: CRX Package (Advanced)

For enterprise deployment or offline installation.

#### Creating CRX Package:

1. Load extension using Method 1
2. In `chrome://extensions/`, click "Pack extension"
3. Select extension folder
4. Click "Pack Extension"
5. CRX file will be created

#### Installing CRX:

1. Drag CRX file to `chrome://extensions/`
2. Click "Add Extension"
3. Verify installation

---

## ⚙️ Configuration

### Initial Setup

#### 1. Weather Widget Configuration

The weather widget requires a free API key:

**Get API Key:**

1. Visit [WeatherAPI.com](https://www.weatherapi.com/signup.asp)
2. Sign up for free account
3. Copy your API key

**Configure Extension:**

**Option A: Edit Files (Before Installation)**

1. Open `widgets.js` in text editor
2. Find line 3: `const API_KEY = 'YOUR_WEATHERAPI_KEY_HERE';`
3. Replace with your key: `const API_KEY = 'abc123xyz456';`
4. Save file
5. Load/reload extension

**Option B: Edit Files (After Installation)**

1. Right-click extension in `chrome://extensions/`
2. Click "Details"
3. Find extension location on disk
4. Edit `widgets.js` and `api.js` files
5. Save changes
6. Reload extension

**Files to Update:**

```javascript
// widgets.js (line 3)
const API_KEY = "your_actual_api_key_here";

// api.js (line 4)
this.weatherApiKey = "your_actual_api_key_here";

// terminal.js (line ~680 in weather command)
const apiKey = "your_actual_api_key_here";
```

#### 2. GPS Permissions

Weather uses GPS for auto-location:

1. Open new tab with CyberTerminal
2. Browser will prompt for location permission
3. Click "Allow" to enable GPS-based weather
4. If blocked, click lock icon in address bar → Site settings → Location → Allow

#### 3. Theme Selection

Choose your preferred theme:

```bash
# In terminal, type one of:
theme set matrix        # Green (default)
theme set kali          # Blue
theme set ubuntu        # Orange
theme set neon-purple   # Purple
theme set hacker-amber  # Amber
```

#### 4. Optional Features

**Disable Matrix Animation** (for better performance):

```bash
matrix
```

**Enable Developer Mode**:

```bash
dev.mode.enable
```

---

## ✔️ Verification

### Test Installation

#### 1. Open New Tab

- Press `Ctrl+T` (Windows/Linux) or `Cmd+T` (Mac)
- CyberTerminal should appear
- Boot sequence should play

#### 2. Test Basic Commands

```bash
# Test terminal
help
clear
ls
pwd
cat welcome.txt

# Test filesystem
mkdir test
cd test
touch file.txt
ls
cd ..
```

#### 3. Test Widgets

- **Clock**: Should show current time
- **Weather**: May show "Loading" or "GPS Denied" initially
- **Crypto**: Should load BTC/ETH prices
- **Quote**: Should display a quote
- **System Monitor**: Should show CPU/RAM usage
- **Logs**: Should show system events

#### 4. Test Features

```bash
# Search
find *.txt
grep "Welcome" welcome.txt

# Network
crypto BTC
quote
news

# Utilities
neofetch
cowsay "Hello"
```

### Check Console

1. Press `F12` to open DevTools
2. Check "Console" tab
3. Should see no errors (warnings OK)
4. If errors appear, see Troubleshooting

---

## 🔧 Troubleshooting

### Common Issues

#### Extension Not Loading

**Symptoms:**

- New tab shows default Chrome page
- Extension not in `chrome://extensions/`

**Solutions:**

1. Verify folder contains `manifest.json`
2. Check Developer Mode is enabled
3. Try removing and re-adding extension
4. Check Chrome version (must be 90+)

#### Weather Not Working

**Symptoms:**

- "Loading..." forever
- "GPS Denied" message
- "API Error" message

**Solutions:**

**If GPS Denied:**

1. Click lock icon in address bar
2. Site settings → Location → Allow
3. Reload page

**If API Error:**

1. Verify API key is correct
2. Check WeatherAPI.com account status
3. Ensure you're within free tier limits (1M calls/month)
4. Check internet connection

**Manual Fix:**

```bash
# In terminal, test GPS manually
weather gps
```

#### Commands Not Working

**Symptoms:**

- `bash: command not found`
- No output from commands
- Console errors

**Solutions:**

1. Clear browser cache
2. Reload extension
3. Check DevTools console for errors
4. Try `clear` command
5. Reload page (`F5`)

#### Matrix Animation Lag

**Symptoms:**

- Slow performance
- High CPU usage
- Choppy animations

**Solutions:**

```bash
# Disable matrix animation
matrix

# Use simpler theme
theme set kali
```

#### Storage Full

**Symptoms:**

- Can't create files
- "Storage quota exceeded"

**Solutions:**

```bash
# Clear command history
history -c

# Remove old files
rm old_file.txt

# Check browser storage settings
# chrome://settings/siteData
```

### Console Errors

#### localStorage Errors

```javascript
Error: Failed to read 'localStorage'
```

**Solution:**

1. Enable cookies in Chrome settings
2. Check `chrome://settings/content/cookies`
3. Allow localStorage for `chrome-extension://`

#### API Fetch Errors

```javascript
net::ERR_NAME_NOT_RESOLVED;
```

**Solution:**

1. Check internet connection
2. Verify API endpoints are accessible
3. Check firewall/proxy settings

---

## 🗑️ Uninstallation

### Remove Extension

#### Method 1: Chrome Extensions Page

1. Go to `chrome://extensions/`
2. Find CyberTerminal
3. Click "Remove"
4. Confirm removal

#### Method 2: Toolbar

1. Right-click extension icon
2. Select "Remove from Chrome"
3. Confirm removal

### Clean Up Data

#### Clear Extension Data

1. Go to `chrome://settings/siteData`
2. Search for "chrome-extension"
3. Remove CyberTerminal entries

#### Delete Files (If Unpacked)

1. Navigate to installation folder
2. Delete entire `cyberterminal` folder

### Reset Chrome New Tab

After uninstallation:

1. New tab will revert to Chrome default
2. Or: Install another new tab extension

---

## 🔄 Updating

### Manual Update (Unpacked)

1. Download latest version
2. Extract to same location
3. Go to `chrome://extensions/`
4. Click reload icon on CyberTerminal
5. Open new tab to verify

### Automatic Update (Web Store)

When available:

- Chrome will auto-update extensions
- Check for updates: `chrome://extensions/` → "Update" button

### Checking Version

```bash
# In terminal
sys.info
# Look for "Shell: cybershell v1.0"
```

---

## 💡 Tips

### Best Practices

1. **Install Location**: Keep in permanent folder (not Downloads)
2. **Updates**: Check GitHub for updates regularly
3. **Backups**: Export important files before updating
4. **Performance**: Disable matrix animation if slow
5. **Privacy**: Use GPS selectively

### Keyboard Shortcuts

```
Ctrl+T          Open new tab (with CyberTerminal)
Ctrl+L          Clear terminal
Tab             Autocomplete
↑/↓             History navigation
F12             Open DevTools
```

### Recommended Setup

```bash
# First-time setup commands
theme set matrix
weather gps
neofetch
```

---

## 📞 Support

### Need Help?

- 📖 [Read the docs](https://github.com/Rehankumar554/cyberterminal)
- 💬 [Ask questions](https://github.com/Rehankumar554/cyberterminal/discussions)
- 🐛 [Report bugs](https://github.com/Rehankumar554/cyberterminal/issues)
- 📧 Email: work.rehankumarsahu@gmail.com

### Before Asking for Help

Please provide:

1. Chrome version
2. OS and version
3. Extension version
4. Steps to reproduce issue
5. Console errors (if any)
6. Screenshots

---

## 📚 Additional Resources

- [README.md](README.md) - Full documentation
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [LICENSE](LICENSE) - License information

---

<div align="center">

**Installation complete! Open a new tab and start hacking! 💚**

[⬆ Back to Top](#-installation-guide)

</div>
