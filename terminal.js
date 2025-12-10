class Terminal {
  constructor() {
    this.input = document.getElementById("input");
    this.output = document.getElementById("output");
    this.prompt = document.getElementById("prompt");
    this.history = [];
    this.historyIndex = -1;
    this.currentPath = "/home/user";
    this.username = "user";
    this.hostname = "cyberterm";
    this.devMode = false;
    this.commandBuffer = "";

    this.init();
  }

  init() {
    this.loadHistory();
    this.loadUsername();
    this.updatePrompt();
    this.setupEventListeners();
    this.showWelcome();
  }

  setupEventListeners() {
    this.input.addEventListener("keydown", (e) => this.handleKeyDown(e));
    this.input.addEventListener("input", (e) => this.handleInput(e));

    document.addEventListener("click", (e) => {
      // Only focus if clicking in terminal area
      if (e.target.closest(".terminal-section")) {
        this.input.focus();
      }
    });
  }

  handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = this.input.value.trim();
      if (cmd) {
        this.executeCommand(cmd);
        this.addToHistory(cmd);
      } else {
        this.addOutput("");
      }
      this.input.value = "";
      this.historyIndex = -1;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.navigateHistory(-1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      this.navigateHistory(1);
    } else if (e.key === "Tab") {
      e.preventDefault();
      this.autocomplete();
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      this.clearScreen();
    }
  }

  handleInput(e) {
    this.commandBuffer = e.target.value;
  }

  navigateHistory(direction) {
    if (this.history.length === 0) return;

    if (direction === -1) {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
      }
    } else {
      if (this.historyIndex > -1) {
        this.historyIndex--;
      }
    }

    if (this.historyIndex === -1) {
      this.input.value = "";
    } else {
      this.input.value =
        this.history[this.history.length - 1 - this.historyIndex];
    }
  }

  autocomplete() {
    const cmd = this.input.value.trim();
    const commands = Object.keys(this.commands);
    const matches = commands.filter((c) => c.startsWith(cmd));

    if (matches.length === 1) {
      this.input.value = matches[0] + " ";
    } else if (matches.length > 1) {
      this.addOutput(`\n${matches.join("  ")}`);
    }
  }

  addToHistory(cmd) {
    this.history.push(cmd);
    if (this.history.length > 1000) {
      this.history.shift();
    }
    this.saveHistory();
  }

  saveHistory() {
    try {
      localStorage.setItem("commandHistory", JSON.stringify(this.history));
    } catch (error) {
      console.error("Failed to save history:", error);
    }
  }

  loadHistory() {
    try {
      const stored = localStorage.getItem("commandHistory");
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch (error) {
      this.history = [];
    }
  }

  loadUsername() {
    try {
      const stored = localStorage.getItem("username");
      if (stored) {
        this.username = stored;
        this.updatePrompt();
      }
    } catch (error) {
      // Use default username
    }
  }

  updatePrompt() {
    const path = this.currentPath === "/home/user" ? "~" : this.currentPath;
    this.prompt.textContent = `${this.username}@${this.hostname}:${path}$`;
  }

  executeCommand(input) {
    this.addOutput(`${this.prompt.textContent} ${input}`);

    // Handle command chaining
    if (input.includes("&&")) {
      const cmds = input.split("&&").map((c) => c.trim());
      for (const cmd of cmds) {
        this.executeSingleCommand(cmd);
      }
    } else if (input.includes(";")) {
      const cmds = input.split(";").map((c) => c.trim());
      for (const cmd of cmds) {
        this.executeSingleCommand(cmd);
      }
    } else if (input.includes("|")) {
      this.executePipe(input);
    } else {
      this.executeSingleCommand(input);
    }

    this.scrollToBottom();
  }

  executeSingleCommand(input) {
    const parts = input.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (this.commands[cmd]) {
      this.commands[cmd].call(this, args);
    } else {
      this.addOutput(`bash: ${cmd}: command not found`, "error");
    }
  }

  executePipe(input) {
    const cmds = input.split("|").map((c) => c.trim());
    let output = "";

    for (let i = 0; i < cmds.length; i++) {
      // Simple pipe simulation
      if (i === 0) {
        this.executeSingleCommand(cmds[i]);
      } else {
        this.addOutput(`[PIPE] ${cmds[i]}`);
      }
    }
  }

  commands = {
    help: function () {
      const helpText = `
Available Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FILE SYSTEM:
  ls [path]              List directory contents
  cd <path>              Change directory
  pwd                    Print working directory
  cat <file>             Display file contents
  touch <file>           Create new file
  rm <file>              Remove file
  mkdir <dir>            Create directory
  rmdir <dir>            Remove directory
  cp <src> <dest>        Copy file
  cp -r <src> <dest>     Copy directory recursively
  mv <src> <dest>        Move/rename file or directory
  head <file>            Show first 10 lines
  head -n <num> <file>   Show first N lines
  tail <file>            Show last 10 lines
  tail -n <num> <file>   Show last N lines
  wc <file>              Count lines, words, characters

SYSTEM:
  clear                  Clear terminal screen
  echo <text>            Display text
  date                   Show current date
  time                   Show current time
  whoami                 Display current user
  uptime                 Show system uptime
  history                Show command history
  sys.info               Display system information
  sys.log                Show system logs

NETWORK:
  weather                Get GPS-based weather
  weather gps            Refresh weather with GPS
  crypto <symbol>        Get crypto prices (BTC, ETH)
  news                   Fetch latest news
  quote                  Get random quote

UTILITIES:
  theme set <name>       Change theme (matrix, kali, ubuntu, neon-purple, hacker-amber)
  open <service>         Open service (gmail, chatgpt, youtube, github)
  dev.mode.enable        Enable developer mode

CHAINING:
  cmd1 ; cmd2            Execute commands sequentially
  cmd1 && cmd2           Execute cmd2 if cmd1 succeeds
  cmd1 | cmd2            Pipe output (basic simulation)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use ↑↓ arrows for command history | Tab for autocomplete
`;
      this.addOutput(helpText, "info");
    },

    clear: function () {
      this.clearScreen();
    },

    echo: function (args) {
      this.addOutput(args.join(" "));
    },

    date: function () {
      const now = new Date();
      this.addOutput(now.toDateString());
    },

    time: function () {
      const now = new Date();
      this.addOutput(now.toLocaleTimeString());
    },

    whoami: function () {
      this.addOutput(this.username);
    },

    uptime: function () {
      const uptime = systemMonitor.getUptime();
      this.addOutput(`up ${uptime}`);
    },

    history: function (args) {
      if (args[0] === "-c") {
        this.history = [];
        this.saveHistory();
        this.addOutput("History cleared");
      } else {
        this.history.forEach((cmd, idx) => {
          this.addOutput(`${idx + 1}  ${cmd}`);
        });
      }
    },

    ls: function (args) {
      const showAll = args.includes("-a") || args.includes("--all");
      const path = args.find((a) => !a.startsWith("-")) || this.currentPath;

      try {
        const items = fileSystem.listDirectory(path);
        if (items.length === 0) {
          return;
        }

        const output = items
          .filter((item) => showAll || !item.name.startsWith("."))
          .map((item) => {
            const color = item.type === "directory" ? "info" : "success";
            return item.type === "directory" ? `${item.name}/` : item.name;
          })
          .join("  ");

        this.addOutput(output);
      } catch (err) {
        this.addOutput(err.message, "error");
      }
    },

    cd: function (args) {
      if (args.length === 0) {
        this.currentPath = "/home/user";
      } else {
        try {
          this.currentPath = fileSystem.changePath(this.currentPath, args[0]);
        } catch (err) {
          this.addOutput(err.message, "error");
        }
      }
      this.updatePrompt();
    },

    pwd: function () {
      this.addOutput(this.currentPath);
    },

    cat: function (args) {
      if (args.length === 0) {
        this.addOutput("cat: missing file operand", "error");
        return;
      }

      try {
        const content = fileSystem.readFile(this.currentPath, args[0]);
        this.addOutput(content);
      } catch (err) {
        this.addOutput(err.message, "error");
      }
    },

    touch: function (args) {
      if (args.length === 0) {
        this.addOutput("touch: missing file operand", "error");
        return;
      }

      try {
        fileSystem.createFile(this.currentPath, args[0], "");
        this.addOutput(`Created file: ${args[0]}`, "success");
      } catch (err) {
        this.addOutput(err.message, "error");
      }
    },

    rm: function (args) {
      if (args.length === 0) {
        this.addOutput("rm: missing file operand", "error");
        return;
      }

      try {
        fileSystem.deleteFile(this.currentPath, args[0]);
        this.addOutput(`Removed: ${args[0]}`, "success");
      } catch (err) {
        this.addOutput(err.message, "error");
      }
    },

    mkdir: function (args) {
      if (args.length === 0) {
        this.addOutput("mkdir: missing directory operand", "error");
        return;
      }

      try {
        fileSystem.createDirectory(this.currentPath, args[0]);
        this.addOutput(`Created directory: ${args[0]}`, "success");
      } catch (err) {
        this.addOutput(err.message, "error");
      }
    },

    rmdir: function (args) {
      if (args.length === 0) {
        this.addOutput("rmdir: missing directory operand", "error");
        return;
      }

      try {
        fileSystem.deleteDirectory(this.currentPath, args[0]);
        this.addOutput(`Removed directory: ${args[0]}`, "success");
      } catch (err) {
        this.addOutput(err.message, "error");
      }
    },

    cp: function (args) {
      if (args.length < 2) {
        this.addOutput("cp: missing file operand", "error");
        this.addOutput(
          "Usage: cp <source> <destination> or cp -r <source> <destination>"
        );
        return;
      }

      const isRecursive = args[0] === "-r";
      const source = isRecursive ? args[1] : args[0];
      const destination = isRecursive ? args[2] : args[1];

      if (!source || !destination) {
        this.addOutput("cp: missing file operand", "error");
        return;
      }

      try {
        if (isRecursive) {
          fileSystem.copyDirectory(this.currentPath, source, destination);
          this.addOutput(
            `Copied directory: ${source} → ${destination}`,
            "success"
          );
        } else {
          fileSystem.copyFile(this.currentPath, source, destination);
          this.addOutput(`Copied: ${source} → ${destination}`, "success");
        }
      } catch (err) {
        this.addOutput(err.message, "error");
      }
    },

    mv: function (args) {
      if (args.length < 2) {
        this.addOutput("mv: missing file operand", "error");
        this.addOutput("Usage: mv <source> <destination>");
        return;
      }

      const source = args[0];
      const destination = args[1];

      try {
        // Check if it's a simple rename (same directory)
        if (!destination.includes("/") && !source.includes("/")) {
          fileSystem.renameFile(this.currentPath, source, destination);
          this.addOutput(`Renamed: ${source} → ${destination}`, "success");
        } else {
          fileSystem.moveFile(this.currentPath, source, destination);
          this.addOutput(`Moved: ${source} → ${destination}`, "success");
        }
      } catch (err) {
        this.addOutput(err.message, "error");
      }
    },

    head: function (args) {
      if (args.length === 0) {
        this.addOutput("head: missing file operand", "error");
        this.addOutput("Usage: head <file> or head -n <number> <file>");
        return;
      }

      let lines = 10;
      let filename = args[0];

      // Check for -n flag
      if (args[0] === "-n" && args[1]) {
        lines = parseInt(args[1]);
        filename = args[2];

        if (isNaN(lines) || lines < 1) {
          this.addOutput("head: invalid number of lines", "error");
          return;
        }
      }

      if (!filename) {
        this.addOutput("head: missing file operand", "error");
        return;
      }

      try {
        const content = fileSystem.readFile(this.currentPath, filename);
        const allLines = content.split("\n");
        const outputLines = allLines.slice(0, lines);
        this.addOutput(outputLines.join("\n"));
      } catch (err) {
        this.addOutput(err.message, "error");
      }
    },

    tail: function (args) {
      if (args.length === 0) {
        this.addOutput("tail: missing file operand", "error");
        this.addOutput("Usage: tail <file> or tail -n <number> <file>");
        return;
      }

      let lines = 10;
      let filename = args[0];

      // Check for -n flag
      if (args[0] === "-n" && args[1]) {
        lines = parseInt(args[1]);
        filename = args[2];

        if (isNaN(lines) || lines < 1) {
          this.addOutput("tail: invalid number of lines", "error");
          return;
        }
      }

      if (!filename) {
        this.addOutput("tail: missing file operand", "error");
        return;
      }

      try {
        const content = fileSystem.readFile(this.currentPath, filename);
        const allLines = content.split("\n");
        const outputLines = allLines.slice(-lines);
        this.addOutput(outputLines.join("\n"));
      } catch (err) {
        this.addOutput(err.message, "error");
      }
    },

    wc: function (args) {
      if (args.length === 0) {
        this.addOutput("wc: missing file operand", "error");
        this.addOutput("Usage: wc <file>");
        return;
      }

      const filename = args[0];

      try {
        const content = fileSystem.readFile(this.currentPath, filename);
        const lines = content.split("\n").length;
        const words = content.split(/\s+/).filter((w) => w.length > 0).length;
        const chars = content.length;

        this.addOutput(`  ${lines}  ${words}  ${chars} ${filename}`);
      } catch (err) {
        this.addOutput(err.message, "error");
      }
    },

    theme: function (args) {
      if (args[0] === "set" && args[1]) {
        const theme = args[1];
        const validThemes = [
          "matrix",
          "kali",
          "ubuntu",
          "neon-purple",
          "hacker-amber",
        ];

        if (validThemes.includes(theme)) {
          themeManager.setTheme(theme);
          this.addOutput(`Theme changed to: ${theme}`, "success");
        } else {
          this.addOutput(
            `Invalid theme. Available: ${validThemes.join(", ")}`,
            "error"
          );
        }
      } else {
        this.addOutput("Usage: theme set <name>", "warning");
      }
    },

    open: function (args) {
      if (args.length === 0) {
        this.addOutput("Usage: open <service>", "warning");
        return;
      }

      const services = {
        gmail: "https://mail.google.com",
        chatgpt: "https://chat.openai.com",
        youtube: "https://youtube.com",
        github: "https://github.com",
      };

      const service = args[0].toLowerCase();
      if (services[service]) {
        this.addOutput(`Opening ${service}...`, "success");
        window.open(services[service], "_blank");
      } else {
        this.addOutput(`Unknown service: ${service}`, "error");
        this.addOutput(`Available: ${Object.keys(services).join(", ")}`);
      }
    },

    weather: function (args) {
      if (args[0] === "gps") {
        this.addOutput("Getting GPS location...", "info");

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            this.addOutput(
              `GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
              "success"
            );
            this.addOutput("Fetching weather data...", "info");

            const apiKey = "YOUR_WEATHERAPI_KEY_HERE";

            fetch(
              `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}&aqi=no`
            )
              .then((res) => res.json())
              .then((data) => {
                if (data.current) {
                  this.addOutput(
                    `Temperature: ${Math.round(data.current.temp_c)}°C`
                  );
                  this.addOutput(`Conditions: ${data.current.condition.text}`);
                  this.addOutput(`Humidity: ${data.current.humidity}%`);
                  this.addOutput(`Wind: ${data.current.wind_kph} km/h`);
                  this.addOutput(
                    `Location: ${data.location.name}, ${data.location.country}`,
                    "success"
                  );

                  // Update widget
                  const html = `
                    <div id="weather-temp">${Math.round(
                      data.current.temp_c
                    )}°C</div>
                    <div id="weather-desc">${data.current.condition.text}</div>
                    <div id="weather-humidity">Humidity: ${
                      data.current.humidity
                    }%</div>
                    <div id="weather-location">${data.location.name}, ${
                    data.location.country
                  }</div>
                  `;
                  document.getElementById("weather-display").innerHTML = html;
                } else {
                  this.addOutput("Failed to fetch weather data", "error");
                }
              })
              .catch((err) => {
                this.addOutput("Failed to fetch weather data", "error");
              });
          },
          (error) => {
            this.addOutput("GPS location denied or unavailable", "error");
          }
        );

        return;
      }

      this.addOutput("Fetching weather data from GPS...", "info");
      apiManager.getWeather().then((data) => {
        if (data) {
          this.addOutput(`Temperature: ${data.temp}°C`);
          this.addOutput(`Conditions: ${data.description}`);
          this.addOutput(`Humidity: ${data.humidity}%`);
          this.addOutput(`Wind: ${data.windSpeed} km/h`);
          this.addOutput(`Location: ${data.city}, ${data.country}`, "success");
        } else {
          this.addOutput(
            "Weather data not available. Enable GPS permissions.",
            "error"
          );
        }
      });
    },

    crypto: function (args) {
      const symbol = args[0] ? args[0].toUpperCase() : "BTC";
      this.addOutput(`Fetching ${symbol} price...`, "info");

      apiManager.getCryptoPrice(symbol).then((price) => {
        if (price) {
          this.addOutput(`${symbol}: $${price}`, "success");
        }
      });
    },

    news: function () {
      this.addOutput("Fetching latest news...", "info");
      apiManager.getNews().then((articles) => {
        if (articles && articles.length > 0) {
          articles.forEach((article, idx) => {
            this.addOutput(`\n${idx + 1}. ${article.title}`);
            this.addOutput(`   ${article.url}`, "info");
          });
        }
      });
    },

    quote: function () {
      this.addOutput("Fetching quote...", "info");
      apiManager.getQuote().then((quote) => {
        if (quote) {
          this.addOutput(`\n"${quote.content}"`);
          this.addOutput(`   — ${quote.author}`, "info");
        }
      });
    },

    "sys.info": function () {
      const info = systemMonitor.getSystemInfo();
      this.addOutput("\nSYSTEM INFORMATION:", "info");
      this.addOutput("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      Object.entries(info).forEach(([key, value]) => {
        this.addOutput(`${key.padEnd(20)}: ${value}`);
      });
      this.addOutput("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    },

    "sys.log": function () {
      const logs = systemMonitor.getLogs();
      this.addOutput("\nSYSTEM LOGS:", "info");
      this.addOutput("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      logs.forEach((log) => {
        this.addOutput(log);
      });
      this.addOutput("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    },

    "dev.mode.enable": function () {
      this.devMode = true;
      this.addOutput("Developer mode enabled", "success");
      this.addOutput(
        "Additional debugging information will be displayed",
        "info"
      );
    },

    neofetch: function () {
      const ascii = `
     ██████╗██╗   ██╗██████╗ ███████╗██████╗ 
    ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗
    ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝
    ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗
    ╚██████╗   ██║   ██████╔╝███████╗██║  ██║
     ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝
      ████████╗███████╗██████╗ ███╗   ███╗
      ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║
         ██║   █████╗  ██████╔╝██╔████╔██║
         ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║
         ██║   ███████╗██║  ██║██║ ╚═╝ ██║
         ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝
`;
      this.addOutput(ascii, "success");
      this.addOutput(`User: ${this.username}@${this.hostname}`);
      this.addOutput(`OS: CyberTerm Linux`);
      this.addOutput(`Kernel: 5.15.0-cyber`);
      this.addOutput(`Uptime: ${systemMonitor.getUptime()}`);
      this.addOutput(`Shell: cybershell v1.0`);
    },

    cowsay: function (args) {
      const text = args.join(" ") || "Moo!";
      const ascii = `
 ${"_".repeat(text.length + 2)}
< ${text} >
 ${"-".repeat(text.length + 2)}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||
`;
      this.addOutput(ascii);
    },

    matrix: function () {
      const canvas = document.getElementById("matrix-canvas");
      const style = canvas.style.opacity;
      canvas.style.opacity = style === "0" ? "0.15" : "0";
      this.addOutput(
        `Matrix effect ${style === "0" ? "enabled" : "disabled"}`,
        "success"
      );
    },
  };

  addOutput(text, className = "") {
    const line = document.createElement("div");
    line.className = `output-line ${className}`;
    line.textContent = text;
    this.output.appendChild(line);
  }

  clearScreen() {
    this.output.innerHTML = "";
  }

  scrollToBottom() {
    const terminal = document.querySelector(".terminal-body");
    terminal.scrollTop = terminal.scrollHeight;
  }

  showWelcome() {
    const welcome = `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██████╗██╗   ██╗██████╗ ███████╗██████╗                   ║
║  ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗                  ║
║  ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝                  ║
║  ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗                  ║
║  ╚██████╗   ██║   ██████╔╝███████╗██║  ██║                  ║
║   ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝                  ║
║    ████████╗███████╗██████╗ ███╗   ███╗                     ║
║    ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║                     ║
║       ██║   █████╗  ██████╔╝██╔████╔██║                     ║
║       ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║                     ║
║       ██║   ███████╗██║  ██║██║ ╚═╝ ██║                     ║
║       ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝                     ║
║                                                               ║
║             Level 7 Linux-Grade Cyber Terminal                ║
║                    Version 1.0.0                              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

Welcome to CyberTerm - Advanced Terminal Environment
Type 'help' for available commands
`;
    this.addOutput(welcome, "success");
  }
}

// Initialize terminal on page load
let terminal;
window.addEventListener("DOMContentLoaded", () => {
  terminal = new Terminal();
});
