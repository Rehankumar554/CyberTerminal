# 🚀 CyberTerminal - Level 7 Linux-Grade Terminal for Chrome

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/chrome-extension-orange.svg)

A fully functional, Linux-grade terminal emulator that replaces your Chrome New Tab with a powerful cyber-themed command-line interface. Built with vanilla JavaScript, featuring a complete virtual filesystem, real-time widgets, and authentic terminal experience.

---

## 📸 Screenshots

```
╔═══════════════════════════════════════════════════════════════╗
║   ██████╗██╗   ██╗██████╗ ███████╗██████╗                   ║
║  ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗                  ║
║  ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝                  ║
║  ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗                  ║
║  ╚██████╗   ██║   ██████╔╝███████╗██║  ██║                  ║
║   ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝                  ║
║    ████████╗███████╗██████╗ ███╗   ███╗                     ║
║             Level 7 Linux-Grade Cyber Terminal                ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## ✨ Features

### 🖥️ Terminal Emulator

- **Full Linux Shell Simulation** - 50+ authentic terminal commands
- **Virtual Filesystem** - Complete file/directory operations with persistence
- **Command History** - Full history with ↑↓ navigation (unlimited storage)
- **Tab Completion** - Smart autocomplete for commands and filenames
- **Command Chaining** - Support for `;`, `&&`, and `|` operators
- **Keyboard Shortcuts** - Ctrl+L (clear), Tab (autocomplete), arrows (history)

### 📁 File System Commands

```bash
# Navigation & Viewing
ls, cd, pwd, cat, head, tail, wc

# File Operations
touch, rm, cp, mv, mkdir, rmdir

# Search & Filter
find, grep (with -r and -i flags)

# Piping & Chaining
ls | grep ".txt"
find *.js ; cat file.js
```

### 🎨 Visual Features

- **5 Cyber Themes** - Matrix (green), Kali (blue), Ubuntu (orange), Neon Purple, Hacker Amber
- **Matrix Rain Animation** - Toggleable background effect
- **Radar Scanner** - Animated cyber radar in corner
- **CRT Scanline Effect** - Authentic terminal look
- **Boot Sequence** - Linux-style startup animation
- **Smooth Animations** - GPU-optimized effects

### 📊 Real-Time Widgets

- **⏰ Clock** - Live time and date
- **🌤️ Weather** - GPS-based weather (WeatherAPI integration)
- **💰 Crypto Prices** - Real-time BTC/ETH prices (CoinGecko API)
- **💭 Daily Quotes** - Inspirational programming quotes
- **📊 System Monitor** - Real CPU & RAM usage (browser-based)
- **📝 Event Logs** - System activity monitoring

### 🌐 Network & API Commands

```bash
weather              # GPS-based weather
weather gps          # Refresh location
crypto BTC           # Bitcoin price
crypto ETH           # Ethereum price
news                 # Latest tech news
quote                # Random quote
```

### 🎯 Utility Commands

```bash
theme set matrix     # Change theme
open gmail           # Open web services
neofetch             # System info banner
cowsay "text"        # ASCII cow
matrix               # Toggle matrix effect
sys.info             # Detailed system info
sys.log              # View system logs
```

---

## 🚀 Installation

### Method 1: Load Unpacked (Developer Mode)

1. **Download the Extension**

   ```bash
   git clone https://github.com/yourusername/cyberterminal.git
   cd cyberterminal
   ```

2. **Open Chrome Extensions**

   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)

3. **Load Extension**

   - Click "Load unpacked"
   - Select the `cyberterminal` folder
   - Extension will appear in your extensions list

4. **Open New Tab**
   - Open a new tab (Ctrl+T)
   - CyberTerminal will load automatically!

### Method 2: Chrome Web Store (Coming Soon)

- Search for "CyberTerminal" in Chrome Web Store
- Click "Add to Chrome"

---

## ⚙️ Configuration

### Weather Widget Setup

1. Get free API key from [WeatherAPI.com](https://www.weatherapi.com/signup.asp)
2. Open `widgets.js` (line 3) or `api.js` (line 4)
3. Replace `YOUR_WEATHERAPI_KEY_HERE` with your API key
4. Reload extension

```javascript
// In widgets.js line 3
const API_KEY = "your_actual_api_key_here";

// In api.js line 4
this.weatherApiKey = "your_actual_api_key_here";
```

### Theme Customization

```bash
# In terminal, type:
theme set matrix        # Green Matrix theme
theme set kali          # Blue Kali theme
theme set ubuntu        # Orange Ubuntu theme
theme set neon-purple   # Purple neon theme
theme set hacker-amber  # Amber hacker theme
```

---

## 📖 Command Reference

### File System Operations

| Command              | Description             | Example                   |
| -------------------- | ----------------------- | ------------------------- |
| `ls [path]`          | List directory contents | `ls`, `ls -a`, `ls /home` |
| `cd <path>`          | Change directory        | `cd /logs`, `cd ..`       |
| `pwd`                | Print working directory | `pwd`                     |
| `cat <file>`         | Display file contents   | `cat welcome.txt`         |
| `touch <file>`       | Create new file         | `touch myfile.txt`        |
| `rm <file>`          | Remove file             | `rm oldfile.txt`          |
| `mkdir <dir>`        | Create directory        | `mkdir projects`          |
| `rmdir <dir>`        | Remove directory        | `rmdir old_folder`        |
| `cp <src> <dest>`    | Copy file/directory     | `cp file.txt backup.txt`  |
| `cp -r <src> <dest>` | Copy recursively        | `cp -r folder backup`     |
| `mv <src> <dest>`    | Move/rename             | `mv old.txt new.txt`      |
| `head <file>`        | First 10 lines          | `head readme.md`          |
| `head -n 5 <file>`   | First N lines           | `head -n 5 file.txt`      |
| `tail <file>`        | Last 10 lines           | `tail logs.txt`           |
| `tail -n 5 <file>`   | Last N lines            | `tail -n 20 logs.txt`     |
| `wc <file>`          | Word count              | `wc welcome.txt`          |

### Search & Filter

| Command                 | Description        | Example                       |
| ----------------------- | ------------------ | ----------------------------- |
| `find <pattern>`        | Find files by name | `find *.txt`, `find welcome*` |
| `find <path> <pattern>` | Search in path     | `find /logs system*`          |
| `grep "pattern" <file>` | Search in file     | `grep "Linux" readme.md`      |
| `grep -r "pattern"`     | Recursive search   | `grep -r "error" /logs`       |
| `grep -i "pattern"`     | Case-insensitive   | `grep -i "welcome"`           |
| `cmd \| grep "pattern"` | Filter output      | `ls \| grep ".txt"`           |

### System Commands

| Command       | Description        | Example              |
| ------------- | ------------------ | -------------------- |
| `clear`       | Clear screen       | `clear` or `Ctrl+L`  |
| `echo <text>` | Print text         | `echo "Hello World"` |
| `date`        | Show date          | `date`               |
| `time`        | Show time          | `time`               |
| `whoami`      | Current user       | `whoami`             |
| `uptime`      | System uptime      | `uptime`             |
| `history`     | Command history    | `history`            |
| `history -c`  | Clear history      | `history -c`         |
| `sys.info`    | System information | `sys.info`           |
| `sys.log`     | System logs        | `sys.log`            |

### Network & API

| Command           | Description  | Example                    |
| ----------------- | ------------ | -------------------------- |
| `weather`         | GPS weather  | `weather`                  |
| `weather gps`     | Refresh GPS  | `weather gps`              |
| `crypto <symbol>` | Crypto price | `crypto BTC`, `crypto ETH` |
| `news`            | Tech news    | `news`                     |
| `quote`           | Random quote | `quote`                    |

### Productivity & Widgets

| Command       | Description           | Example                    |
| ------------- | --------------------- | -------------------------- |
| `todo          | Manage tasks          | `todo add "Buy milk"        |
| `note	        | Save quick note	    | `note "Meeting ID: 123"     |
| `notes	        | View/Clear notes	    | `notes list                 |
| `timer	        | Set countdown	        | `timer 25m                  |
| `alarm	        | Set alarm clock	    | `alarm 14:30                |
| `google        | Google Search	        | `google javascript tutorial |
| `youtube       | YouTube Search	    | `youtube funny cats         |
| `github        | GitHub Search	        | `github reactjs             |
| `stackoverflow | StackOverflow Search	| `stackoverflow center div   |
| `wiki          | Wikipedia Search	    | `wiki Albert Einstein       |
| `translate     | Google Translate	    | `translate hello en-hi      |
| `map          	| Google Maps	        | `map New York               |
| `open          | Open popular sites	| `open gmail                 |
| `news          | Fetch latest news	    | `news                       |
| `crypto        | Check crypto price	| `crypto BTC                 |
| `weather       | Check weather	        | `weather gps                |

### Utilities

| Command            | Description          | Example                     |
| ------------------ | -------------------- | --------------------------- |
| `theme set <name>` | Change theme         | `theme set kali`            |
| `set               | Change settings      | set fontSize 18             |
| `open <service>`   | Open web service     | `open gmail`, `open github` |
| `neofetch`         | System banner        | `neofetch`                  |
| `cowsay <text>`    | ASCII cow            | `cowsay "Moo!"`             |
| `matrix`           | Toggle matrix effect | `matrix`                    |
| `dev.mode.enable`  | Developer mode       | `dev.mode.enable`           |
| `setting`          | Export/Import config | settings export             |
| `shortcu`          | Custom keyboard keys | shortcut set "Ctrl+Q" clear"|
| `session`          | Save/Load state      | session save work           |

### Command Chaining

| Operator | Description           | Example                |
| -------- | --------------------- | ---------------------- |
| `;`      | Sequential execution  | `date ; time ; whoami` |
| `&&`     | Conditional execution | `cd /logs && ls`       |
| `\|`     | Pipe output           | `ls \| grep ".txt"`    |

---

## ⌨️ Keyboard Shortcuts

| Shortcut   | Action                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `↑` Arrow           | Previous command                                                                                                    |
| `↓` Arrow           | Next command                                                                                                        |
| `Tab`               | Autocomplete command                                                                                                |
| `Ctrl + L`          | Clear screen                                                                                                        |
| `Ctrl + C`          | Cancel input                                                                                                        |
| `Enter`             | Execute command                                                                                                     |
| `Ctrl + A`          | Move cursor to the start of the line                                                                                |
| `Ctrl + E`          | Move cursor to the end of the line                                                                                  |
| `Alt + B`           | Move cursor back one word                                                                                           |
| `Alt + F`           | Move cursor forward one word                                                                                        |
| `Ctrl + U`          | Clear the entire input line                                                                                         |
| `Ctrl + K`          | Delete text from the cursor position to the end of the line                                                         |
| `Ctrl + W`          | Delete the previous word                                                                                            |
| `Alt + .(Dot)`      | Paste the last argument from the previous command (e.g., if you typed mkdir test, pressing this will type test)     |
| `Ctrl + D`          | Exit/Logout (only works if the input line is empty)                                                                 |
| `Ctrl + Z`          | Suspend the current process (Simulation)                                                                            |
| `Ctrl + R`          | Start Reverse Search to find past commands                                                                          |
| `Ctrl + R` (Again)  | Find the next previous match while searching                                                                        |
| `Ctrl + G` or `ESC` | Cancel the search mode                                                                                              |
| `Backspace`         | Delete characters from your search query                                                                            |

---

## 🏗️ Project Structure

```
cyberterminal/
├── manifest.json          # Chrome extension manifest
├── newtab.html           # Main HTML structure
├── style.css             # Styling and themes
├── terminal.js           # Terminal emulator core
├── fs.js                 # Virtual filesystem
├── widgets.js            # Widget management
├── matrix.js             # Visual effects
├── system.js             # System monitoring
├── api.js                # API integrations
├── themes.js             # Theme management
├── README.md             # Documentation
└── LICENSE               # MIT License
```

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (No frameworks)
- **Storage**: localStorage for persistence
- **APIs**:
  - WeatherAPI (weather data)
  - CoinGecko (crypto prices)
  - Custom APIs (quotes, news)
- **Graphics**: HTML5 Canvas (Matrix rain, radar)
- **Styling**: Pure CSS with CSS variables
- **Architecture**: Modular ES6 classes

---

## 📊 Technical Features

### Virtual Filesystem

- JSON-based structure
- localStorage persistence
- Full CRUD operations
- Path resolution
- Directory traversal
- File/folder management

### Performance

- GPU-optimized animations
- Efficient DOM manipulation
- Lazy loading
- Debounced events
- Memory management

### Real-Time Monitoring

- Browser CPU usage (performance API)
- JavaScript heap memory (performance.memory)
- System uptime tracking
- Network stats simulation
- Event logging

---

## 🎯 Use Cases

- **Developers** - Quick terminal access, file management
- **System Admins** - Command practice, system monitoring
- **Students** - Learn Linux commands, practice scripting
- **Cybersecurity** - Hacking simulation, penetration testing practice
- **Power Users** - Productivity boost, custom workflows
- **Everyone** - Cool cyberpunk aesthetic!

---

## 🚧 Roadmap

### Version 1.1 (Planned)

- [ ] Browser tab management commands
- [ ] Clipboard integration
- [ ] Bookmarks management
- [ ] Download manager
- [ ] Settings panel UI
- [✓] Session save/restore
- [✓] Custom keybindings

### Version 2.0 (Future)

- [ ] AI command suggestions
- [ ] Git integration
- [ ] Code execution (JavaScript, Python)
- [ ] Multi-terminal tabs
- [ ] SSH simulation
- [ ] Package manager
- [ ] Plugin system

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Contribution Guidelines

- Follow existing code style
- Add comments for complex logic
- Test thoroughly before submitting
- Update documentation if needed

---

## 🐛 Bug Reports

Found a bug? Please open an issue with:

- Browser version
- Extension version
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)

---

## 💡 Feature Requests

Have an idea? Open an issue with:

- Feature description
- Use case
- Expected behavior
- Priority (low/medium/high)

---

## 📝 Known Issues

- Weather widget requires manual API key setup
- Some commands may not work identically to Linux
- Browser storage limited to ~5MB per domain
- Matrix animation may affect performance on slower machines

---

## 🔒 Privacy & Security

- **No data collection** - Everything runs locally
- **No external tracking** - Zero analytics
- **No permissions abuse** - Only storage permission used
- **Open source** - Fully transparent code
- **Secure APIs** - Only HTTPS connections

---

## 🌟 Credits

### APIs & Services

- [WeatherAPI](https://www.weatherapi.com/) - Weather data
- [CoinGecko](https://www.coingecko.com/) - Cryptocurrency prices
- [Quotable](https://github.com/lukePeavey/quotable) - Quotes API

### Inspiration

- Linux/Unix terminals
- Kali Linux
- Ubuntu Terminal
- Matrix movie
- Cyberpunk aesthetic

### Fonts

- [Fira Code](https://github.com/tonsky/FiraCode)
- [Share Tech Mono](https://fonts.google.com/specimen/Share+Tech+Mono)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md) file for details.

---

## 👨‍💻 Author

**Rehan Kumar**

- GitHub: [@Rehankumar554](https://github.com/Rehankumar554)
- Email: work.rehankumarsahu@gmail.com
<!-- - Website: [yourwebsite.com](https://yourwebsite.com) -->

---

## 🙏 Acknowledgments

- Thanks to all contributors
- Inspired by the Linux/Unix community
- Built with ❤️ for terminal enthusiasts

---

## 📞 Support

Need help?

- 📖 [Read the docs](https://github.com/yourusername/cyberterminal/wiki)
- 💬 [Join discussions](https://github.com/yourusername/cyberterminal/discussions)
- 🐛 [Report bugs](https://github.com/yourusername/cyberterminal/issues)
- ⭐ Star the repo if you like it!

---

## 📈 Stats

![GitHub stars](https://img.shields.io/github/stars/yourusername/cyberterminal?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/cyberterminal?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/yourusername/cyberterminal?style=social)

---

<div align="center">

**Made with 💚 by terminal enthusiasts, for terminal enthusiasts**

[⬆ Back to Top](#-cyberterminal---level-7-linux-grade-terminal-for-chrome)

</div>
