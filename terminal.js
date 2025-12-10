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
    // Search State
    this.isSearching = false;
    this.searchQuery = "";
    this.searchMatchIndex = -1;
    this.originalPrompt = "";

    this.currentTheme = "matrix"; // Default theme tracker

    // Add this inside constructor()
    this.tips = [
      "Use 'Tab' to autocomplete commands.",
      "Press 'Up Arrow' to cycle through previous commands.",
      "You can chain commands using '&&' (e.g., 'mkdir test && cd test').",
      "Use 'CTRL + L' to quickly clear the screen.",
      "The 'cat' command can read multiple files at once.",
      "Try 'weather gps' to get local weather data.",
      "Pipe output to grep to filter results: 'ls | grep .js'",
      "Use 'open' to launch external websites like Gmail or YouTube.",
    ];

    this.docs = {
      ls: {
        desc: "List directory contents",
        usage: "ls [options] [path]",
        man: "NAME\n\tls - list directory contents\n\nSYNOPSIS\n\tls [-a] [file...]\n\nDESCRIPTION\n\tList information about the FILEs (the current directory by default).\n\nOPTIONS\n\t-a, --all\n\t\tdo not ignore entries starting with .",
        examples: ["ls", "ls -a", "ls /home/user/logs"],
      },
      cd: {
        desc: "Change the shell working directory",
        usage: "cd <path>",
        man: "NAME\n\tcd - change directory\n\nSYNOPSIS\n\tcd [dir]\n\nDESCRIPTION\n\tChange the current directory to dir. The default DIR is the value of the HOME shell variable.",
        examples: ["cd downloads", "cd ..", "cd /home/user"],
      },
      cat: {
        desc: "Concatenate files and print on the standard output",
        usage: "cat <file>",
        man: "NAME\n\tcat - concatenate files and print on the standard output\n\nSYNOPSIS\n\tcat [FILE]...\n\nDESCRIPTION\n\tConcatenate FILE(s) to standard output.",
        examples: ["cat readme.md", "cat file1.txt file2.txt"],
      },
      grep: {
        desc: "Print lines that match patterns",
        usage: "grep <pattern> <file>",
        man: "NAME\n\tgrep - print lines that match patterns\n\nSYNOPSIS\n\tgrep [OPTIONS] PATTERN [FILE...]\n\nDESCRIPTION\n\tSearch for PATTERN in each FILE.\n\nOPTIONS\n\t-r\tRecursive search\n\t-i\tCase insensitive",
        examples: ["grep 'error' system.log", "ls | grep '.txt'"],
      },
      // You can add more specific docs for other commands here
    };

    this.init();
  }

  init() {
    this.loadHistory();
    this.loadUsername();
    this.updatePrompt();
    this.setupEventListeners();
    this.showWelcome();

    // Add this line to show daily tip on startup
    setTimeout(() => {
      this.commands["tip.daily"].call(this);
    }, 500); // Small delay so it appears after the welcome message
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

  // --- REVERSE SEARCH HELPERS ---

  performSearch(findNext) {
    if (this.history.length === 0) return;

    // Kahan se dhundna shuru karein?
    // Agar 'Next' (Ctrl+R again) dabaya hai to pichle result ke peeche se dhundo
    // Nahi to sabse latest history se shuru karo
    let startIndex = findNext
      ? this.searchMatchIndex - 1
      : this.history.length - 1;

    // Loop backwards through history
    for (let i = startIndex; i >= 0; i--) {
      if (this.history[i].includes(this.searchQuery)) {
        this.searchMatchIndex = i;
        this.input.value = this.history[i]; // Found match
        this.updateSearchPrompt("success");
        return;
      }
    }

    // Agar match nahi mila
    this.updateSearchPrompt("fail");
  }

  updateSearchPrompt(status) {
    const prefix =
      status === "fail" ? "(failed reverse-i-search)" : "(reverse-i-search)";
    this.prompt.textContent = `${prefix} \`${this.searchQuery}': `;
  }

  endSearch(restoreOriginal) {
    this.isSearching = false;
    this.prompt.textContent = this.originalPrompt; // Restore user@host prompt

    if (restoreOriginal) {
      this.input.value = ""; // Cancelled
    }
    // Agar restoreOriginal = false hai, to jo match mila tha wo input me hi rahega
  }

  handleKeyDown(e) {
    // 1. HANDLE SEARCH MODE (Ctrl + R Active)
    // ==========================================
    if (this.isSearching) {
      // Exit Search: Esc or Ctrl+G -> Cancel
      if (e.key === "Escape" || (e.ctrlKey && e.key === "g")) {
        e.preventDefault();
        this.endSearch(true);
        return;
      }

      // Execute Match: Enter
      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = this.input.value;
        this.endSearch(false); // Keep the match in input
        if (cmd) {
          this.executeCommand(cmd);
          this.addToHistory(cmd);
        }
        this.input.value = "";
        this.historyIndex = -1;
        return;
      }

      // Navigate Results: Ctrl + R (Find next previous)
      if (e.ctrlKey && e.key === "r") {
        e.preventDefault();
        this.performSearch(true);
        return;
      }

      // Editing Query: Backspace
      if (e.key === "Backspace") {
        e.preventDefault();
        this.searchQuery = this.searchQuery.slice(0, -1);
        this.performSearch(false);
        return;
      }

      // Editing Query: Typing Characters
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        this.searchQuery += e.key;
        this.performSearch(false);
        return;
      }

      // Any other key (Arrow keys etc) accepts match and exits search mode
      this.endSearch(false);
      // Let the event fall through to normal handlers below...
    }

    // ==========================================
    // 2. NORMAL MODE SHORTCUTS
    // ==========================================

    // Start Search Trigger (Ctrl + R)
    if (e.ctrlKey && e.key === "r") {
      e.preventDefault();
      if (!this.isSearching) {
        this.isSearching = true;
        this.searchQuery = "";
        this.searchMatchIndex = -1;
        this.originalPrompt = this.prompt.textContent;
        this.updateSearchPrompt("success");
        this.input.value = "";
      }
      return;
    }

    // 1. EXECUTE COMMAND (Enter)
    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = this.input.value.trim();
      if (cmd) {
        this.executeCommand(cmd);
        this.addToHistory(cmd);
      } else {
        this.addOutput(this.prompt.textContent); // Show empty prompt
      }
      this.input.value = "";
      this.historyIndex = -1;
      return;
    }

    // 2. HISTORY NAVIGATION (Up / Down)
    if (e.key === "ArrowUp") {
      e.preventDefault();
      this.navigateHistory(-1);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.navigateHistory(1);
      return;
    }

    // 3. AUTOCOMPLETE (Tab)
    if (e.key === "Tab") {
      e.preventDefault();
      this.autocomplete();
      return;
    }

    // --- NEW SHORTCUTS ---

    // 4. CLEAR SCREEN (Ctrl + L)
    if (e.ctrlKey && e.key === "l") {
      e.preventDefault();
      this.clearScreen();
      return;
    }

    // 5. CANCEL COMMAND (Ctrl + C)
    if (e.ctrlKey && e.key === "c") {
      e.preventDefault();
      const currentInput = this.input.value;
      this.addOutput(this.prompt.textContent + " " + currentInput + "^C");
      this.input.value = "";
      return;
    }

    // 6. CLEAR LINE (Ctrl + U)
    if (e.ctrlKey && e.key === "u") {
      e.preventDefault();
      this.input.value = "";
      return;
    }

    // 7. DELETE TO END (Ctrl + K)
    if (e.ctrlKey && e.key === "k") {
      e.preventDefault();
      const pos = this.input.selectionStart;
      this.input.value = this.input.value.substring(0, pos);
      return;
    }

    // 8. MOVE TO START (Ctrl + A)
    if (e.ctrlKey && e.key === "a") {
      e.preventDefault();
      this.input.setSelectionRange(0, 0);
      return;
    }

    // 9. MOVE TO END (Ctrl + E)
    if (e.ctrlKey && e.key === "e") {
      e.preventDefault();
      const len = this.input.value.length;
      this.input.setSelectionRange(len, len);
      return;
    }

    // 10. DELETE WORD (Ctrl + W)
    if (e.ctrlKey && e.key === "w") {
      e.preventDefault();
      const pos = this.input.selectionStart;
      const text = this.input.value;
      const left = text.slice(0, pos);
      const right = text.slice(pos);
      // Logic: remove trailing spaces, then remove the word
      const newLeft = left.replace(/(\s*\S+\s*)$/, "");
      this.input.value = newLeft + right;
      this.input.setSelectionRange(newLeft.length, newLeft.length);
      return;
    }

    // 11. EXIT / LOGOUT (Ctrl + D)
    if (e.ctrlKey && e.key === "d") {
      e.preventDefault();
      if (this.input.value === "") {
        this.addOutput("logout");
        setTimeout(() => {
          this.clearScreen();
          this.addOutput("Session closed. Refresh to restart.", "info");
          this.input.disabled = true;
        }, 800);
      }
      return;
    }

    // 12. SUSPEND (Ctrl + Z)
    if (e.ctrlKey && e.key === "z") {
      e.preventDefault();
      this.addOutput(this.prompt.textContent + " " + this.input.value + "^Z");
      this.addOutput("[1]+  Stopped", "info");
      this.input.value = "";
      return;
    }

    // 13. LAST ARGUMENT (Alt + .)
    if (e.altKey && e.key === ".") {
      e.preventDefault();
      if (this.history.length > 0) {
        const lastCmd = this.history[this.history.length - 1];
        const parts = lastCmd.trim().split(/\s+/);
        const lastArg = parts[parts.length - 1];
        // Insert at cursor position
        const start = this.input.selectionStart;
        const end = this.input.selectionEnd;
        const text = this.input.value;
        this.input.value =
          text.substring(0, start) + lastArg + text.substring(end);
        this.input.setSelectionRange(
          start + lastArg.length,
          start + lastArg.length
        );
      }
      return;
    }

    // 14. WORD BACK (Alt + B)
    if (e.altKey && e.key === "b") {
      e.preventDefault();
      const pos = this.input.selectionStart;
      const text = this.input.value;
      // Find last space before cursor
      let newPos = text.lastIndexOf(" ", pos - 2);
      newPos = newPos === -1 ? 0 : newPos + 1;
      this.input.setSelectionRange(newPos, newPos);
      return;
    }

    // 15. WORD FORWARD (Alt + F)
    if (e.altKey && e.key === "f") {
      e.preventDefault();
      const pos = this.input.selectionStart;
      const text = this.input.value;
      let newPos = text.indexOf(" ", pos + 1);
      newPos = newPos === -1 ? text.length : newPos + 1;
      this.input.setSelectionRange(newPos, newPos);
      return;
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

  // --- ERROR HANDLING HELPERS ---

  // Calculates how "different" two words are (for typo detection)
  getLevenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            Math.min(
              matrix[i][j - 1] + 1, // insertion
              matrix[i - 1][j] + 1 // deletion
            )
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  // Centralized Error Handler
  handleError(err, cmd, args) {
    const msg = err.message;

    // 1. File Not Found -> Suggest available files
    if (msg.includes("No such file") || msg.includes("not found")) {
      this.addOutput(`❌ ${msg}`, "error");
      try {
        // List files so user knows what IS available
        const files = fileSystem.listDirectory(this.currentPath);
        const names = files
          .map((f) => (f.type === "directory" ? `${f.name}/` : f.name))
          .join("  ");
        this.addOutput(
          `📂 Available items: ${names || "(empty directory)"}`,
          "info"
        );
      } catch (e) {
        /* ignore */
      }
      return;
    }

    // 2. Not a directory
    if (msg.includes("Not a directory")) {
      this.addOutput(`❌ ${msg}`, "error");
      this.addOutput(
        `💡 Hint: '${args[0]}' is a file. Use 'cat' to read it.`,
        "warning"
      );
      return;
    }

    // 3. Permission Denied (Simulation)
    if (msg.includes("Permission denied")) {
      this.addOutput(`❌ ${msg}`, "error");
      this.addOutput(
        `💡 Hint: Try running 'sudo ${cmd} ${args.join(" ")}'`,
        "warning"
      );
      return;
    }

    // Default Error
    this.addOutput(`❌ Error: ${msg}`, "error");
  }

  executeSingleCommand(input) {
    const parts = input.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (this.commands[cmd]) {
      // Execute command
      try {
        this.commands[cmd].call(this, args);
      } catch (err) {
        // Catch unexpected errors
        this.handleError(err, cmd, args);
      }
    } else {
      // COMMAND NOT FOUND LOGIC
      this.addOutput(`❌ bash: ${cmd}: command not found`, "error");

      // Check for similar commands (Typos)
      const availableCmds = Object.keys(this.commands);
      let closest = null;
      let minDist = 999;

      availableCmds.forEach((c) => {
        const dist = this.getLevenshteinDistance(cmd, c);
        if (dist < minDist) {
          minDist = dist;
          closest = c;
        }
      });

      // If close match found (distance <= 2)
      if (closest && minDist <= 2) {
        this.addOutput(`🤔 Did you mean '${closest}'?`, "warning");
      }
    }
  }

  executePipe(input) {
    const cmds = input.split("|").map((c) => c.trim());

    if (cmds.length < 2) {
      this.executeSingleCommand(input);
      return;
    }

    // Execute first command and capture output
    const firstCmd = cmds[0];
    const secondCmd = cmds[1];

    // Store original output method
    const originalAddOutput = this.addOutput.bind(this);
    let capturedOutput = [];

    // Override addOutput to capture
    this.addOutput = function (text, className) {
      capturedOutput.push(text);
    };

    // Execute first command
    this.executeSingleCommand(firstCmd);

    // Restore original output
    this.addOutput = originalAddOutput;

    // Process second command with captured output
    const parts = secondCmd.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (cmd === "grep") {
      // Filter output with grep pattern
      const pattern = args[0] ? args[0].replace(/^["']|["']$/g, "") : "";

      if (!pattern) {
        this.addOutput("grep: missing pattern", "error");
        return;
      }

      const regex = new RegExp(pattern, "gi");
      const filtered = capturedOutput.filter((line) => regex.test(line));

      if (filtered.length === 0) {
        this.addOutput(`grep: no matches found for '${pattern}'`, "warning");
      } else {
        filtered.forEach((line) => this.addOutput(line, "success"));
      }
    } else {
      // For other commands, just show the captured output
      capturedOutput.forEach((line) => this.addOutput(line));
      this.addOutput(`[PIPE] ${secondCmd}`, "info");
    }
  }

  commands = {
    help: function (args) {
      if (args && args.length > 0) {
        const cmd = args[0];
        if (this.docs[cmd]) {
          this.addOutput(`\nHelp: ${cmd}`, "info");
          this.addOutput(`Description: ${this.docs[cmd].desc}`);
          this.addOutput(`Usage: ${this.docs[cmd].usage}`);
          this.addOutput(
            `Type 'man ${cmd}' for full manual or 'examples ${cmd}' for usage.\n`
          );
        } else if (this.commands[cmd]) {
          this.addOutput(
            `Command '${cmd}' exists but has no detailed documentation.`
          );
        } else {
          this.addOutput(
            `help: no help topics match '${cmd}'. Try 'help' to see all commands.`,
            "error"
          );
        }
        return;
      }
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

SEARCH & FILTER:
  find <pattern>         Find files by name/pattern
  find <path> <pattern>  Search in specific path
  grep "pattern" <file>  Search text in file
  grep -r "pattern"      Search recursively in directory
  grep -i "pattern"      Case-insensitive search
  ls | grep ".txt"       Filter command output
  history | grep "cmd"   Filter history

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

    // --- SESSION MANAGEMENT ---

    session: function (args) {
      if (args.length === 0) {
        this.addOutput("Usage: session <action> [name]", "warning");
        this.addOutput("Actions: save, load, list, delete", "info");
        return;
      }

      const action = args[0];
      const name = args[1];

      // Load all sessions from localStorage
      let sessions = {};
      try {
        sessions = JSON.parse(localStorage.getItem("terminalSessions")) || {};
      } catch (e) {
        sessions = {};
      }

      switch (action) {
        case "save":
          if (!name) {
            this.addOutput("Error: Please provide a session name.", "error");
            return;
          }

          // Capture current state
          const state = {
            timestamp: new Date().toLocaleString(),
            path: this.currentPath,
            history: this.history,
            user: this.username,
            theme: this.currentTheme,
            // Capture Widget HTML content
            weatherWidget: document.getElementById("weather-display")
              ? document.getElementById("weather-display").innerHTML
              : "",
          };

          sessions[name] = state;
          localStorage.setItem("terminalSessions", JSON.stringify(sessions));
          this.addOutput(`💾 Session "${name}" saved successfully.`, "success");
          break;

        case "load":
          if (!name) {
            this.addOutput("Error: Please provide a session name.", "error");
            return;
          }

          if (!sessions[name]) {
            this.addOutput(`❌ Session "${name}" not found.`, "error");
            return;
          }

          const s = sessions[name];

          // 1. Restore Path & History
          this.currentPath = s.path;
          this.history = s.history || [];
          this.username = s.user || "user";

          // 2. Restore Theme (Updated Logic)
          if (s.theme) {
            try {
              // Check Global scope or Window scope
              if (typeof themeManager !== "undefined") {
                themeManager.setTheme(s.theme);
              } else if (window.themeManager) {
                window.themeManager.setTheme(s.theme);
              }

              // Track current theme internally
              this.currentTheme = s.theme;
            } catch (e) {
              console.error("Failed to restore theme:", e);
            }
          }

          // 3. Restore Widgets
          const widgetEl = document.getElementById("weather-display");
          if (widgetEl && s.weatherWidget) {
            widgetEl.innerHTML = s.weatherWidget;
          }

          this.updatePrompt();
          this.addOutput("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "info");
          this.addOutput(`📂 Session "${name}" restored.`, "success");
          this.addOutput(`🎨 Theme: ${s.theme || "default"}`); // Confirmation message
          this.addOutput(`📍 Directory: ${s.path}`);
          this.addOutput("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "info");
          break;

        case "list":
          const keys = Object.keys(sessions);
          if (keys.length === 0) {
            this.addOutput("No saved sessions found.", "warning");
          } else {
            this.addOutput("\n💾 SAVED SESSIONS:", "info");
            keys.forEach((key) => {
              this.addOutput(`• ${key} \t(Saved: ${sessions[key].timestamp})`);
            });
            this.addOutput("");
          }
          break;

        case "delete":
          if (!name) {
            this.addOutput("Error: Session name required.", "error");
            return;
          }
          if (sessions[name]) {
            delete sessions[name];
            localStorage.setItem("terminalSessions", JSON.stringify(sessions));
            this.addOutput(`🗑️ Session "${name}" deleted.`, "success");
          } else {
            this.addOutput(`❌ Session "${name}" not found.`, "error");
          }
          break;

        default:
          this.addOutput(`Unknown action: ${action}`, "error");
      }
    },

    man: function (args) {
      if (args.length === 0) {
        this.addOutput("What manual page do you want?", "warning");
        return;
      }

      const cmd = args[0];
      if (this.docs[cmd]) {
        this.addOutput("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "info");
        this.addOutput(this.docs[cmd].man);
        this.addOutput("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "info");
      } else {
        this.addOutput(`No manual entry for ${cmd}`, "error");
      }
    },

    examples: function (args) {
      if (args.length === 0) {
        this.addOutput("Usage: examples <command>", "warning");
        return;
      }

      const cmd = args[0];
      if (this.docs[cmd] && this.docs[cmd].examples) {
        this.addOutput(`\nExamples for '${cmd}':`, "info");
        this.docs[cmd].examples.forEach((ex) => {
          this.addOutput(`  $ ${ex}`);
        });
        this.addOutput(""); // Empty line for spacing
      } else {
        this.addOutput(`No examples available for ${cmd}`, "warning");
      }
    },

    tutorial: function (args) {
      const topic = args[0] || "start";

      switch (topic) {
        case "start":
          this.addOutput("\n🎓 CyberTerm Interactive Tutorial", "success");
          this.addOutput(
            "Welcome! This tutorial will guide you through the basics."
          );
          this.addOutput("Please follow the steps below:\n");
          this.addOutput(
            '1. Type "tutorial commands" to learn basic file operations.'
          );
          this.addOutput(
            '2. Type "tutorial shortcuts" to learn keyboard hacks.'
          );
          this.addOutput('3. Type "help" at any time to see all tools.\n');
          break;

        case "commands":
          this.addOutput("\n📁 Lesson 1: File System", "info");
          this.addOutput("The file system is a tree of directories and files.");
          this.addOutput("• Create a folder:  mkdir myfolder");
          this.addOutput("• Go inside it:     cd myfolder");
          this.addOutput("• Create a file:    touch hello.txt");
          this.addOutput("• List contents:    ls");
          this.addOutput("• Read file:        cat hello.txt");
          this.addOutput("\nTry creating a file now!");
          break;

        case "shortcuts":
          this.addOutput("\n⌨️ Lesson 2: Keyboard Shortcuts", "info");
          this.addOutput("Become a power user with these keys:");
          this.addOutput("• Tab:        Autocomplete filenames/commands");
          this.addOutput("• Up/Down:    Navigate command history");
          this.addOutput("• Ctrl + L:   Clear the screen");
          this.addOutput("• Ctrl + C:   Cancel current command (simulation)");
          break;

        default:
          this.addOutput(
            `Tutorial topic '${topic}' not found. Try 'tutorial start'.`,
            "error"
          );
      }
    },

    tip: function (args) {
      // args[0] is handled via tip.daily logic below, but standard 'tip' command:
      const randomTip = this.tips[Math.floor(Math.random() * this.tips.length)];
      this.addOutput("\n💡 TIP: " + randomTip, "success");
    },

    "tip.daily": function () {
      // Check local storage to see if we already showed a tip today
      const today = new Date().toDateString();
      const lastTipDate = localStorage.getItem("lastTipDate");

      // If we haven't shown a tip today (or never have)
      if (lastTipDate !== today) {
        const randomTip =
          this.tips[Math.floor(Math.random() * this.tips.length)];
        this.addOutput("\n💡 DAILY TIP: " + randomTip, "success");
        localStorage.setItem("lastTipDate", today);
      }
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
        this.updatePrompt();
        return;
      }
      try {
        this.currentPath = fileSystem.changePath(this.currentPath, args[0]);
        this.updatePrompt();
      } catch (err) {
        this.handleError(err, "cd", args); // <--- New Handler
      }
    },

    sudo: function (args) {
      if (args.length === 0) {
        this.addOutput("Usage: sudo <command>", "warning");
        return;
      }
      this.addOutput("🔑 Enter password for user:", "info");
      // Just a simulation, we immediately run the command
      setTimeout(() => {
        this.addOutput("**********");
        this.addOutput("Access granted.", "success");
        this.executeSingleCommand(args.join(" "));
      }, 1000);
    },

    pwd: function () {
      this.addOutput(this.currentPath);
    },

    cat: function (args) {
      // Validate Syntax
      if (args.length === 0) {
        this.addOutput("❌ Invalid syntax", "error");
        this.addOutput(
          `Usage: ${this.docs.cat ? this.docs.cat.usage : "cat <file>"}`,
          "warning"
        );
        return;
      }

      try {
        const content = fileSystem.readFile(this.currentPath, args[0]);
        this.addOutput(content);
      } catch (err) {
        this.handleError(err, "cat", args); // <--- New Handler
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

    find: function (args) {
      if (args.length === 0) {
        this.addOutput("find: missing operand", "error");
        this.addOutput("Usage: find <pattern> or find <path> <pattern>");
        return;
      }

      let searchPath = this.currentPath;
      let pattern = args[0];

      // Check if first arg is a path
      if (args.length > 1) {
        searchPath = args[0].startsWith("/") ? args[0] : this.currentPath;
        pattern = args[1];
      }

      try {
        const results = fileSystem.findFiles(searchPath, pattern, true);

        if (results.length === 0) {
          this.addOutput(`find: no files matching '${pattern}'`, "warning");
          return;
        }

        results.forEach((result) => {
          const icon = result.type === "directory" ? "📁" : "📄";
          this.addOutput(
            `${icon} ${result.path}`,
            result.type === "directory" ? "info" : "success"
          );
        });

        this.addOutput(`\nFound ${results.length} item(s)`, "info");
      } catch (err) {
        this.addOutput(err.message, "error");
      }
    },

    grep: function (args) {
      if (args.length === 0) {
        this.addOutput("grep: missing pattern", "error");
        this.addOutput(
          'Usage: grep "pattern" <file> or grep -r "pattern" <path>'
        );
        return;
      }

      const isRecursive = args[0] === "-r";
      const isCaseSensitive = args.includes("-i");

      let pattern, target;

      if (isRecursive) {
        pattern = args[1];
        target = args[2] || this.currentPath;
      } else {
        pattern = args[0];
        target = args[1];
      }

      if (!pattern) {
        this.addOutput("grep: missing pattern", "error");
        return;
      }

      // Remove quotes from pattern if present
      pattern = pattern.replace(/^["']|["']$/g, "");

      try {
        if (isRecursive || !target) {
          // Search in directory recursively
          const searchPath = target || this.currentPath;
          const results = fileSystem.searchInDirectory(
            searchPath,
            pattern,
            true,
            isCaseSensitive
          );

          if (results.length === 0) {
            this.addOutput(
              `grep: no matches found for '${pattern}'`,
              "warning"
            );
            return;
          }

          results.forEach((result) => {
            this.addOutput(`\n${result.file}:`, "info");
            result.matches.forEach((match) => {
              this.addOutput(`  ${match.lineNumber}: ${match.line}`, "success");
            });
          });

          this.addOutput(`\nFound in ${results.length} file(s)`, "info");
        } else {
          // Search in specific file
          const matches = fileSystem.searchInFile(
            this.currentPath,
            target,
            pattern,
            isCaseSensitive
          );

          if (!matches) {
            this.addOutput(`grep: ${target}: No such file`, "error");
            return;
          }

          if (matches.length === 0) {
            this.addOutput(
              `grep: no matches found for '${pattern}' in ${target}`,
              "warning"
            );
            return;
          }

          matches.forEach((match) => {
            this.addOutput(`${match.lineNumber}: ${match.line}`, "success");
          });

          this.addOutput(`\n${matches.length} match(es) found`, "info");
        }
      } catch (err) {
        this.addOutput(err.message, "error");
      }
    },

    theme: function (args) {
      if (args[0] === "set" && args[1]) {
        const themeName = args[1];
        const validThemes = [
          "matrix",
          "kali",
          "ubuntu",
          "neon-purple",
          "hacker-amber",
        ];

        if (validThemes.includes(themeName)) {
          // --- FIX START ---

          // 1. Visual Change (Ye line color badlegi)
          // Hum try-catch use karenge taaki agar themeManager na mile to error dikh jaye
          try {
            if (typeof themeManager !== "undefined") {
              themeManager.setTheme(themeName);
            } else if (window.themeManager) {
              window.themeManager.setTheme(themeName);
            } else {
              console.warn("ThemeManager not found");
            }
          } catch (e) {
            console.error("Theme change failed:", e);
          }

          // 2. Session Tracking (Ye line session save ke liye hai)
          this.currentTheme = themeName;

          // --- FIX END ---

          this.addOutput(`Theme changed to: ${themeName}`, "success");
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

    // --- SEARCH ENGINES & GOOGLE APPS ---
    google: function (args) {
      if (args.length === 0) {
        this.addOutput("Usage: google <query>", "warning");
        return;
      }
      const query = args.join(" ");
      this.addOutput(`Searching Google for: "${query}"...`, "success");
      window.open(
        `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        "_blank"
      );
    },

    youtube: function (args) {
      if (args.length === 0) {
        this.addOutput("Usage: youtube <query>", "warning");
        return;
      }
      const query = args.join(" ");
      this.addOutput(`Searching YouTube for: "${query}"...`, "success");
      window.open(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(
          query
        )}`,
        "_blank"
      );
    },

    github: function (args) {
      if (args.length === 0) {
        this.addOutput("Usage: github <query>", "warning");
        return;
      }
      const query = args.join(" ");
      this.addOutput(`Searching GitHub for: "${query}"...`, "success");
      window.open(
        `https://github.com/search?q=${encodeURIComponent(query)}`,
        "_blank"
      );
    },

    stackoverflow: function (args) {
      if (args.length === 0) {
        this.addOutput("Usage: stackoverflow <question>", "warning");
        return;
      }
      const query = args.join(" ");
      this.addOutput(`Searching StackOverflow for: "${query}"...`, "success");
      window.open(
        `https://stackoverflow.com/search?q=${encodeURIComponent(query)}`,
        "_blank"
      );
    },

    wiki: function (args) {
      if (args.length === 0) {
        this.addOutput("Usage: wiki <topic>", "warning");
        return;
      }
      const query = args.join(" ");
      this.addOutput(`Searching Wikipedia for: "${query}"...`, "success");
      window.open(
        `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(
          query
        )}`,
        "_blank"
      );
    },

    map: function (args) {
      if (args.length === 0) {
        this.addOutput("Usage: map <location>", "warning");
        return;
      }
      const location = args.join(" ");
      this.addOutput(`Opening Maps for: "${location}"...`, "success");
      window.open(
        `https://www.google.com/maps/search/${encodeURIComponent(location)}`,
        "_blank"
      );
    },

    translate: function (args) {
      if (args.length === 0) {
        this.addOutput("Usage: translate <text> [lang-code]", "warning");
        this.addOutput("Example: translate hello world en-hi", "info");
        return;
      }

      // Check if last argument looks like a language code (e.g., en-hi, es, fr)
      const lastArg = args[args.length - 1];
      let langPair = "auto";
      let textToTranslate = "";

      // Simple check: if last arg contains '-' or is 2 chars long, assume it's language
      if (lastArg.includes("-") || (lastArg.length === 2 && args.length > 1)) {
        langPair = lastArg;
        textToTranslate = args.slice(0, -1).join(" ");
      } else {
        textToTranslate = args.join(" ");
      }

      // If format is en-hi, split source and target
      let source = "auto";
      let target = "en";

      if (langPair.includes("-")) {
        [source, target] = langPair.split("-");
      } else if (langPair !== "auto") {
        target = langPair;
      }

      this.addOutput(`Translating "${textToTranslate}"...`, "success");
      window.open(
        `https://translate.google.com/?sl=${source}&tl=${target}&text=${encodeURIComponent(
          textToTranslate
        )}`,
        "_blank"
      );
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
