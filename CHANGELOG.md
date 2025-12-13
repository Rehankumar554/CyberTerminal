# Changelog

All notable changes to CyberTerminal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

# Changelog

## [v1.3.0] - 2025-12-13

### 🚀 Added

- **Download Manager:**
  - Implemented `monitorDownload` with direct DOM manipulation for sticky progress bars.
  - Added `download progress` command to restore live bars after clearing screen.
  - Live speed calculation (MB/s) and visual ASCII progress bars.
- **Range Support Engine:**
  - Added helper `resolveTargets` to support inputs like `1-5`, `1,3`, and `all`.
  - Applied to `tabs`, `history.browser`, and `download` commands.
- **Fetch Command:**
  - Added native `fetch` with auto HTTPS and JSON pretty-printing.

### 🛠 Changed

- **Tabs Command:** Added `dedup` (deduplication) and `discard` (memory saver) features.
- **History Command:** Added `stats` mode for domain analytics.
- **Manifest:** Added `downloads`, `downloads.open`, and `history` permissions.

### 🗑 Removed

- **Edit Command:** Removed `edit` and `nano` functionality to keep the terminal lightweight.
- **Hybrid FS:** Removed complex local-storage file wrappers (`cp`, `touch` for virtual files) in favor of standard system commands.

## [1.2.0] - 2025-12-14

### 🌟 New Major Feature: Browser Tab Manager

Added `tabs` command suite to control browser tabs via CLI without a mouse.

- **Listing & Navigation**:

  - `tabs list [query]`: View tabs with ID, Status, Pin, and Audio indicators. Search support added.
  - `tabs switch <sn>`: Fast switching using Serial Numbers.

- **Creation & Cleanup**:

  - `tabs new`: Smart multi-open (e.g., `tabs new 2 google` opens 2 Google tabs).
  - `tabs close`: Supports multiple SNs (`1 3 5`) and `all`.
  - `tabs dedup`: Auto-detects and closes duplicate URLs.

- **State Management**:
  - `reload`, `pin/unpin`, `mute/unmute`: Bulk support for all/multiple tabs.
  - `discard`: Memory saver mode to suspend inactive tabs.

### 🛠️ Technical

- Added `"tabs"` permission to `manifest.json`.
- Implemented Auto-Fetch logic (no need to run `list` before actions).

## [1.1.0] - 2025-12-12

### 🚀 New Features

#### Productivity Tools

- **Calculator (`calc`)**: Added a safe, in-terminal mathematical expression evaluator.
- **Password Generator (`passgen`)**: Generate secure, random passwords with custom lengths.

#### Web & Navigation

- **Bookmark Manager (`bookmark`)**: Save, list, and open custom URLs. Includes smart duplicate detection against system services.
- **Smart Open (`open`)**: Enhanced `open` command to launch both system services and user bookmarks.

#### System

- **Aliases (`alias`)**: Create custom shortcuts for long or complex commands.
- **Setup Wizard**: Added a first-time user setup for username configuration.
- **Network Monitor**: Added real-time internet status (Online/Offline/Speed) to the UI.

### 🐛 Bug Fixes & Improvements

- **Security**: Prevented spaces in usernames during setup.
- **Math**: Fixed regex issues in the calculator to support spaces and standard operators.
- **URL Handling**: Improved URL normalization for bookmarks to prevent duplicates.

---

## [1.0.0] - 2025-12-10

### 🎉 Initial Release

The first stable release of CyberTerminal - Level 7 Linux-Grade Terminal for Chrome!

### ✨ Added

#### Terminal Emulator

- Full terminal emulation with 50+ Linux commands
- Command history with unlimited storage
- Tab completion for commands and filenames
- Command chaining with `;`, `&&`, and `|` operators
- Keyboard shortcuts (Ctrl+L, Tab, Arrows)
- Real-time command execution
- Error handling with Linux-style messages

#### File System

- Complete virtual filesystem with JSON storage
- localStorage persistence across sessions
- Full CRUD operations (Create, Read, Update, Delete)
- Directory navigation (`ls`, `cd`, `pwd`)
- File viewing (`cat`, `head`, `tail`)
- File operations (`touch`, `rm`, `cp`, `mv`)
- Directory management (`mkdir`, `rmdir`)
- Word count utility (`wc`)

#### Search & Filter

- `find` command with wildcard support (`*.txt`)
- `grep` command for text search in files
- Recursive search with `-r` flag
- Case-insensitive search with `-i` flag
- Pipe filtering (`ls | grep ".txt"`)
- Pattern matching with wildcards

#### Visual Features

- 5 cyber-themed color schemes:
  - Matrix (green) - Default
  - Kali (blue)
  - Ubuntu (orange)
  - Neon Purple
  - Hacker Amber
- Matrix rain background animation
- CRT scanline effect
- Boot sequence animation
- Smooth GPU-optimized transitions
- Blinking cursor
- Glowing borders and shadows

#### Widgets

- **Clock Widget** - Real-time clock with date
- **Weather Widget** - GPS-based weather (WeatherAPI)
- **Crypto Widget** - Real-time BTC/ETH prices (CoinGecko)
- **Quote Widget** - Daily programming quotes
- **System Monitor** - Real CPU & RAM usage
- **Event Logs** - System activity tracking

#### Network & API

- GPS-based weather with auto-location
- Real-time cryptocurrency prices
- Latest tech news headlines
- Random inspirational quotes
- Web service shortcuts (Gmail, GitHub, etc.)

#### Commands Implemented

- **File System**: `ls`, `cd`, `pwd`, `cat`, `touch`, `rm`, `mkdir`, `rmdir`, `cp`, `mv`, `head`, `tail`, `wc`
- **Search**: `find`, `grep`
- **Productivity**: `todo`, `note`, `notes list`, `timer`, `alarm`
- **Web Search**: `google <query>`, `youtube <query>`, `github <query>`, `stackoverflow <query>`, `wiki <query>`, `map <location>`, `translate <text>`, `open <service>`, `quicklink`, `weather <gps>`, `news`, `crypto <symbol>`
- **System Utilities**: `clear`, `history`, `neofetch`, `date / time`, `whoami`, `sudo <command>`, `sys.info`, `sys.log`, `dev.mode.enable`
- **Settings & Session**: `session save <name>`, `session save work`, `session load <name>`, `theme set <name>`, `set fontSize <px>`, `set opacity <0-1>`, `shortcut list`
- **Help & Fun**: `help [cmd]`, `man <cmd>`, `examples <cmd>`, `tutorial`, `tip`, `matrix`, `cowsay <text>`

#### Documentation

- Comprehensive README.md
- MIT License
- Contributing guidelines
- Changelog

### 🎨 Design

- Cyberpunk/hacker aesthetic
- Dark theme with neon accents
- Monospace fonts (Fira Code, Share Tech Mono)
- Responsive layout
- Smooth animations

### ⚡ Performance

- GPU-optimized canvas rendering
- Efficient DOM manipulation
- Lazy loading for widgets
- Debounced event handlers
- Optimized localStorage usage

### 🔒 Security & Privacy

- No data collection
- No external tracking
- Local storage only
- HTTPS API calls
- No permissions abuse

---

## [Unreleased]

### 🚧 Planned for v1.1.0

#### Browser Integration

- [ ] Tab management commands (`tab list`, `tab close`, `tab new`)
- [ ] Bookmark management (`bookmark add`, `bookmark list`)
- [ ] Browser history access
- [ ] Download manager integration

#### Clipboard & Selection

- [ ] Clipboard commands (`clip copy`, `clip paste`)
- [ ] Clipboard history
- [ ] Text selection utilities

#### Settings & Preferences

- [ ] Settings panel UI
- [✓] Font size customization
- [✓] Opacity control
- [✓] Custom prompt
- [✓] Startup commands
- [✓] Settings import/export

#### Session Management

- [✓] Session save/restore
- [✓] Named sessions
- [ ] Auto-save option
- [✓] Session list

#### Enhanced Features

- [✓] More keyboard shortcuts
- [✓] Custom keybindings
- [✓] Better error messages
- [✓] Command suggestions
- [✓] Improved autocomplete

### 🔮 Planned for v2.0.0

#### Advanced Features

- [ ] AI command suggestions (Claude/ChatGPT integration)
- [ ] Git integration
- [ ] Code execution (JavaScript, Python)
- [ ] Multi-terminal tabs
- [ ] SSH simulation
- [ ] Package manager
- [ ] Plugin system

#### Productivity

- [✓] Todo list integrated
- [✓] Notes system
- [✓] Timer/Pomodoro
- [ ] Calculator
- [ ] Text editor (nano/vim mode)

#### Enhanced Widgets

- [ ] Network monitor
- [ ] Battery status
- [ ] Stock market widget
- [ ] Calendar widget
- [ ] Music player integration

#### Developer Tools

- [ ] npm/pip commands
- [ ] Docker integration
- [ ] API testing tools
- [ ] JSON formatter
- [ ] Base64 encoder/decoder

---

## Version History

### [1.0.0] - 2025-12-10

- 🎉 Initial public release
- ✨ 50+ terminal commands
- 🎨 5 cyber themes
- 📊 6 real-time widgets
- 🔍 Advanced search & filter
- 🌐 API integrations

---

## Release Notes

### How to Upgrade

1. **From Chrome Web Store** (when available):

   - Extension will auto-update
   - Reload extension if needed

2. **Manual Installation**:
   - Download latest release
   - Replace old files
   - Reload extension in Chrome

### Breaking Changes

None in v1.0.0 (first release)

### Migration Guide

Not applicable for v1.0.0

---

## Deprecated Features

None yet.

---

## Known Issues

### Version 1.0.0

- Weather widget requires manual API key configuration
- Some commands may differ slightly from Linux
- Browser storage limited to ~5MB
- Matrix animation may affect performance on slower devices
- Clipboard integration not yet available
- Browser tab management not yet implemented

### Workarounds

**Weather API Setup:**

1. Get free API key from WeatherAPI.com
2. Edit `widgets.js` line 3
3. Replace `YOUR_WEATHERAPI_KEY_HERE`

**Performance Issues:**

- Disable matrix animation: `matrix` command
- Use simpler themes: `theme set kali`
- Clear command history: `history -c`

---

## Credits

### Contributors

- **Rehan kumar** - Initial development and design

### Special Thanks

- Linux/Unix community for command inspiration
- Chrome extension developers for guidance
- Open source contributors

### API Providers

- WeatherAPI - Weather data
- CoinGecko - Cryptocurrency prices
- Quotable API - Inspirational quotes

---

## Support

### Reporting Issues

- 🐛 [Report bugs](https://github.com/Rehankumar554/cyberterminal/issues)
- 💡 [Request features](https://github.com/Rehankumar554/cyberterminal/issues)
- 💬 [Ask questions](https://github.com/Rehankumar554/cyberterminal/discussions)

### Getting Help

- 📖 [Documentation](https://github.com/Rehankumar554/cyberterminal)
- 📧 Email: work.rehankumarsahu@gmail.com
- 🌟 Star the repo!

---

<div align="center">

**CyberTerminal** - Level 7 Linux-Grade Terminal for Chrome

[Homepage](https://github.com/Rehankumar554/cyberterminal) •
[Issues](https://github.com/Rehankumar554/cyberterminal/issues) •
[Discussions](https://github.com/Rehankumar554/cyberterminal/discussions)

</div>
