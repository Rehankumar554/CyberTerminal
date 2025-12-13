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
    this.isSetupMode = false;
    this.devMode = false;

    this.commandBuffer = "";
    // Search State
    this.isSearching = false;
    this.searchQuery = "";
    this.searchMatchIndex = -1;
    this.originalPrompt = "";

    // Constructor ke andar add karein
    this.ghostInput = document.getElementById("ghost-input");
    this.currentSuggestion = "";

    this.activeTimer = null; // Timer track karne ke liye
    this.activeAlarm = null; // Alarm track karne ke liye

    this.settings = {
      fontSize: 14,
      opacity: 0.95,
      customPrompt: null,
      startupCmd: null,
      matrixEnabled: true,
      particlesEnabled: true,
      shortcuts: {}, // e.g. "Ctrl+q": "clear"
    };

    this.particles = [];

    this.currentTheme = "matrix"; // Default theme tracker

    // Add this inside constructor()
    this.tips = [];

    this.docs = {};

    this.init();
  }

  init() {
    this.loadSettings(); // 1. Settings load karein
    this.applySettings(); // 2. Visuals apply karein (font/opacity)
    this.loadHistory();
    this.loadUsername();
    this.updatePrompt();
    this.setupEventListeners();
    this.loadTips();
    this.loadDocs();
    this.loadServices();
    this.initFileExplorer();
    this.initSettingsUI();
    this.initContextMenu();
    this.initParticles();

    if (this.settings.startupCmd) {
      setTimeout(() => {
        if (this.settings.startupCmd !== "none") {
          this.executeCommand(this.settings.startupCmd);
        }
      }, 600);
    }

    const isSetupComplete = localStorage.getItem("cyber_setup_complete");

    if (isSetupComplete) {
      // NORMAL MODE
      this.loadUsername(); // Saved username load karein
      this.updatePrompt();
      this.loadTips();
      this.showWelcome();
      this.runStartupCmd();
    } else {
      // SETUP MODE (First Time)
      this.isSetupMode = true;
      this.prompt.textContent = ""; // Prompt chupayein
      this.input.placeholder = "System initializing...";
      this.input.disabled = true;

      // Boot khatam hone ka wait karein
      document.addEventListener("boot-finished", () => {
        this.input.disabled = false;
        this.input.placeholder = "";
        this.input.focus();

        this.output.innerHTML = ""; // Screen clear
        this.addOutput("╔══════════════════════════════════════╗", "success");
        this.addOutput("║     NEW USER CONFIGURATION           ║", "success");
        this.addOutput("╚══════════════════════════════════════╝", "success");
        this.addOutput("\nSystem requires a username to proceed.", "info");

        this.prompt.textContent = "create_user: ";
      });
    }
    // Daily tip wala code...
    setTimeout(() => {
      // Agar aapne tips.json bhi lagaya hai to 'loadTips()' call karein
      // Nahi to purana code rakhein
      if (this.commands["tip.daily"]) {
        this.commands["tip.daily"].call(this);
      }
    }, 500);
  }

  initParticles() {
    this.particleCanvas = document.getElementById("particle-canvas");
    this.pCtx = this.particleCanvas.getContext("2d");

    // Resize Handler
    const resize = () => {
      this.particleCanvas.width = window.innerWidth;
      this.particleCanvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    // Animation Loop
    const animate = () => {
      if (!this.settings.particlesEnabled) {
        this.pCtx.clearRect(
          0,
          0,
          this.particleCanvas.width,
          this.particleCanvas.height
        );
        requestAnimationFrame(animate);
        return;
      }

      this.pCtx.clearRect(
        0,
        0,
        this.particleCanvas.width,
        this.particleCanvas.height
      );

      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.vy += 0.1; // Gravity

        this.pCtx.fillStyle = `rgba(${p.color}, ${p.life})`;
        this.pCtx.beginPath();
        this.pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.pCtx.fill();

        if (p.life <= 0) {
          this.particles.splice(i, 1);
          i--;
        }
      }
      requestAnimationFrame(animate);
    };
    animate();
  }

  spawnParticles() {
    if (!this.settings.particlesEnabled) return;

    const inputRect = this.input.getBoundingClientRect();
    // Estimate cursor position (Rough calculation for monospaced font)
    const charWidth = this.settings.fontSize * 0.6;
    const cursorX = inputRect.left + this.input.selectionStart * charWidth + 10;
    const cursorY = inputRect.top + inputRect.height / 2;

    // Create Sparks
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: cursorX,
        y: cursorY,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
        color: "0, 255, 0", // Green sparks
        size: Math.random() * 2 + 1,
      });
    }
  }

  initContextMenu() {
    const menu = document.getElementById("context-menu");

    // Show Menu
    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const x = e.clientX;
      const y = e.clientY;
      menu.style.display = "block";
      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
    });

    // Hide Menu
    document.addEventListener("click", () => (menu.style.display = "none"));

    // Handle Actions
    menu.querySelectorAll(".menu-item").forEach((item) => {
      item.addEventListener("click", async () => {
        const action = item.getAttribute("data-action");
        switch (action) {
          case "copy":
            const sel = window.getSelection().toString();
            if (sel) navigator.clipboard.writeText(sel);
            break;
          case "paste":
            try {
              const text = await navigator.clipboard.readText();
              this.input.value += text;
              this.input.focus();
            } catch (e) {}
            break;
          case "clear":
            this.executeCommand("clear");
            break;
          case "refresh":
            location.reload();
            break;
          case "fullscreen":
            if (!document.fullscreenElement)
              document.documentElement.requestFullscreen();
            else if (document.exitFullscreen) document.exitFullscreen();
            break;
          case "settings":
            document.getElementById("settings-btn").click();
            break;
        }
      });
    });
  }

  initSettingsUI() {
    const modal = document.getElementById("settings-modal");
    const btn = document.getElementById("settings-btn");
    const closeBtn = document.getElementById("close-settings");

    // Inputs
    const themeSelect = document.getElementById("setting-theme");
    const fontRange = document.getElementById("setting-font");
    const fontDisplay = document.getElementById("font-val");
    const opacityRange = document.getElementById("setting-opacity");
    const opacityDisplay = document.getElementById("opacity-val");
    const matrixCheck = document.getElementById("setting-matrix");
    const particlesCheck = document.getElementById("setting-particles");

    // Open Modal logic
    if (btn) {
      btn.addEventListener("click", () => {
        // Load current values
        themeSelect.value = this.currentTheme;
        fontRange.value = this.settings.fontSize;
        fontDisplay.textContent = this.settings.fontSize;
        opacityRange.value = this.settings.opacity;
        opacityDisplay.textContent = this.settings.opacity;
        matrixCheck.checked = this.settings.matrixEnabled;
        particlesCheck.checked = this.settings.particlesEnabled;

        modal.classList.remove("modal-hidden");
      });
    }

    // Toggle Listener
    if (particlesCheck) {
      particlesCheck.addEventListener("change", (e) => {
        this.settings.particlesEnabled = e.target.checked;
        this.saveSettings();

        if (this.settings.particlesEnabled) {
          showToast("Power Mode Enabled!");
        } else {
          showToast("Power Mode Disabled");
        }
      });
    }

    // Close Modal logic
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.classList.add("modal-hidden");
        this.input.focus(); // Return focus to terminal
      });
    }

    // Real-time Updates
    themeSelect.addEventListener("change", (e) => {
      const newTheme = e.target.value;

      // --- FIX: Direct access to global variable (Safe Check) ---
      if (typeof themeManager !== "undefined") {
        themeManager.setTheme(newTheme);
      } else if (window.themeManager) {
        window.themeManager.setTheme(newTheme);
      } else {
        console.warn("ThemeManager not loaded");
      }

      this.currentTheme = newTheme;
      this.saveSettings();
    });

    fontRange.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      fontDisplay.textContent = val;
      this.settings.fontSize = val;
      this.applySettings();
      this.saveSettings();
    });

    opacityRange.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      opacityDisplay.textContent = val;
      this.settings.opacity = val;
      this.applySettings();
      this.saveSettings();
    });

    matrixCheck.addEventListener("change", (e) => {
      this.settings.matrixEnabled = e.target.checked;
      this.saveSettings();

      const canvas = document.getElementById("matrix-canvas");
      if (canvas) {
        canvas.style.opacity = this.settings.matrixEnabled ? "0.7" : "0";
      }
    });
  }

  runStartupCmd() {
    if (this.settings.startupCmd && this.settings.startupCmd !== "none") {
      setTimeout(() => {
        this.executeCommand(this.settings.startupCmd);
      }, 600);
    }

    // Daily tip check
    setTimeout(() => {
      if (this.commands["tip.daily"]) {
        this.commands["tip.daily"].call(this);
      }
    }, 500);
  }

  // --- DOCS LOADER (New Integration) ---
  async loadDocs() {
    try {
      const response = await fetch("assets/jsons/cmd_docs.json");
      if (!response.ok) throw new Error("Failed to load documentation");
      this.docs = await response.json();
    } catch (error) {
      console.error("Error loading cmd_docs.json:", error);
      this.addOutput("Warning: Could not load command documentation.", "error");

      // Fallback: Agar file na mile to kam se kam basic help chale
      this.docs = {
        help: {
          desc: "Show help",
          usage: "help",
          man: "Help command",
          examples: [],
        },
      };
    }
  }

  async loadTips() {
    try {
      const response = await fetch("assets/jsons/tips.json");
      if (!response.ok) throw new Error("Failed to load tips");
      this.tips = await response.json();
    } catch (error) {
      console.error("Error loading tips.json:", error);
      // Fallback tips agar file na mile
      this.tips = [
        "Tip: Type 'help' to see available commands.",
        "Tip: Use Tab for autocomplete.",
        "Tip: Ctrl+L clears the screen.",
      ];
    }
  }

  // --- SERVICE LOADER ---
  async loadServices() {
    try {
      const response = await fetch("assets/jsons/services.json");
      if (!response.ok) throw new Error("Failed to load services");
      this.services = await response.json();
    } catch (error) {
      console.error("Error loading services.json:", error);
      this.addOutput("Warning: Could not load external services.", "error");
      // Fallback empty object
      this.services = {};
    }
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

  // --- SETTINGS HELPERS ---

  loadSettings() {
    const saved = localStorage.getItem("terminalSettings");
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }
  }

  saveSettings() {
    localStorage.setItem("terminalSettings", JSON.stringify(this.settings));
  }

  applySettings() {
    const size = this.settings.fontSize;
    const opacity = this.settings.opacity;
    const matrixCanvas = document.getElementById("matrix-canvas");
    const container = document.querySelector(".container");
    const widgets = document.querySelector(".widgets-section");

    // Check karein ki kya dynamic style tag pehle se maujud hai
    let styleTag = document.getElementById("dynamic-term-style");

    if (matrixCanvas) {
      // Agar enabled hai to 0.15 opacity, nahi to 0
      // matrixCanvas.style.opacity = this.settings.matrixEnabled ? "0.15" : "0";
      matrixCanvas.style.opacity = this.settings.matrixEnabled ? "0.7" : "0";
    }

    // --- DYNAMIC CSS INJECTION ---
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "dynamic-term-style";
      document.head.appendChild(styleTag);
    }

    styleTag.innerHTML = `
    /* Font Size Control */
    .output-line, #input, .prompt, .terminal-body {
      font-size: ${size}px !important;
      line-height: ${Math.round(size * 1.4)}px !important;
    }
    
    /* Advanced Opacity Control */
    .terminal-section {
      /* Background Color: Opacity user ke hisaab se (0 means fully transparent black) */
      background: rgba(0, 0, 0, ${opacity}) !important;
      
      /* Blur Effect: Hamesha ON rahega (Frosted Glass Look) */
      backdrop-filter: blur(3px) !important;
      -webkit-backdrop-filter: blur(3px) !important;
      
      /* Shadow aur Border: Glass feel ke liye zaroori hain */
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
    }

    /* Scanlines (TV effect) ko 0 opacity par hata dete hain taaki saaf dikhe */
    .terminal-section::before {
      display: ${opacity < 0.1 ? "none" : "block"} !important;
    }
    
    /* Widget Transparency Update */
    .widget {
       background: rgba(10, 14, 39, ${Math.max(opacity, 0.2)}) !important;
       backdrop-filter: blur(10px);
    }
  `;
  }

  // Update this existing method to support custom prompt
  updatePrompt() {
    if (this.settings.customPrompt) {
      this.prompt.textContent = this.settings.customPrompt;
    } else {
      const path = this.currentPath === "/home/user" ? "~" : this.currentPath;
      this.prompt.textContent = `${this.username}@${this.hostname}:${path}$`;
    }
  }

  // 1. Initialize File Explorer
  initFileExplorer() {
    this.updateFileExplorerWidget();
  }

  // 2. Update/Render Logic (Fixed: Removed Quotes)
  updateFileExplorerWidget() {
    const container = document.getElementById("file-list");
    if (!container) return;

    try {
      // Current path se files fetch karein
      const items = fileSystem.listDirectory(this.currentPath);

      container.innerHTML = ""; // Clear previous list

      if (items.length === 0) {
        container.innerHTML =
          '<div style="padding:10px; color:#666; text-align:center; font-style:italic;">(Empty Directory)</div>';
        return;
      }

      // Sort: Folders pehle, fir Files
      items.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "directory" ? -1 : 1;
      });

      // ".." (Go Back) Option add karein (agar root mein nahi hain)
      if (this.currentPath !== "/") {
        const upDiv = document.createElement("div");
        upDiv.className = "file-item is-directory";
        upDiv.innerHTML = `<span class="file-icon">⤴️</span><span class="file-name">..</span>`;
        upDiv.onclick = () => this.executeCommand("cd ..");
        container.appendChild(upDiv);
      }

      // Items Render Karein
      items.forEach((item) => {
        const div = document.createElement("div");
        div.className = `file-item ${
          item.type === "directory" ? "is-directory" : ""
        }`;

        // Icons based on type
        const icon = item.type === "directory" ? "📁" : "📄";

        div.innerHTML = `
        <div style="display:flex; align-items:center; flex:1; overflow:hidden;">
          <span class="file-icon">${icon}</span>
          <span class="file-name">${item.name}</span>
        </div>
        <div class="file-actions">
          <button class="delete-btn" title="Delete">❌</button>
        </div>
      `;

        // Click Event: Open File/Folder
        div.onclick = (e) => {
          // Agar delete button par click kiya to open mat karo
          if (e.target.closest(".delete-btn")) return;

          if (item.type === "directory") {
            // FIX: Removed quotes around item.name
            this.executeCommand(`cd ${item.name}`);
          } else {
            // FIX: Removed quotes around item.name
            this.executeCommand(`cat ${item.name}`);
          }
        };

        // Delete Event
        const delBtn = div.querySelector(".delete-btn");
        delBtn.onclick = (e) => {
          e.stopPropagation(); // Bubble up roko
          const cmd = item.type === "directory" ? "rmdir" : "rm";
          // FIX: Removed quotes around item.name
          this.executeCommand(`${cmd} ${item.name}`);
        };

        container.appendChild(div);
      });
    } catch (e) {
      container.innerHTML = `<div style="color:red; padding:10px;">Error: ${e.message}</div>`;
    }
  }

  handleKeyDown(e) {
    // --- INTELLISENSE ACCEPT (Right Arrow) ---
    if (e.key === "ArrowRight" && this.currentSuggestion) {
      // Agar cursor line ke end pe hai, tabhi accept karein (Optional, but standard behavior)
      if (this.input.selectionStart === this.input.value.length) {
        e.preventDefault();
        this.input.value = this.currentSuggestion;
        this.updateGhost(this.input.value); // Re-calc ghost (usually clears it)
        this.checkSyntax(this.input.value); // Update syntax color
        return;
      }
    }
    // --- CUSTOM SHORTCUTS CHECK ---
    // Key generate karo: e.g. "Ctrl+k", "Alt+m"
    let keyCombo = "";
    if (e.ctrlKey) keyCombo += "Ctrl+";
    if (e.altKey) keyCombo += "Alt+";
    if (e.shiftKey) keyCombo += "Shift+";
    keyCombo += e.key.toUpperCase(); // Case insensitive match ke liye

    // Check karo agar ye combo settings me exist karta hai
    // Hum settings me keys ko bhi store karte waqt dhyan rakhenge
    // (User input "Ctrl+t" might be stored strictly, so loop check is safer)

    // Simple direct match attempt:
    for (const [combo, cmd] of Object.entries(this.settings.shortcuts)) {
      // Case-insensitive comparison
      if (combo.toUpperCase() === keyCombo) {
        e.preventDefault();
        this.executeCommand(cmd);
        // Optionally add to history or just run quietly
        return;
      }
    }

    if (this.isSetupMode) {
      if (e.key === "Enter") {
        e.preventDefault();
        const val = this.input.value.trim();
        this.handleSetupInput(val); // Naya handler call karein
        this.input.value = "";
      }
      return; // Baaki shortcuts block karein
    }

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
        showToast("Search Mode On");
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

    // 3. AUTOCOMPLETE (Tab) - Updated with Ghost Text Support
    if (e.key === "Tab") {
      e.preventDefault();

      // Priority 1: Agar Ghost Suggestion (Grey text) dikh raha hai, to use accept karo
      if (this.currentSuggestion) {
        this.input.value = this.currentSuggestion;
        this.updateGhost(this.input.value); // Ghost text ko clear/update karo
        this.checkSyntax(this.input.value); // Color update karo (Green/Red)
      }
      // Priority 2: Agar Ghost text nahi hai, to standard autocomplete try karo
      else {
        this.autocomplete();
      }
      return;
    }

    // --- NEW SHORTCUTS ---

    // 4. CLEAR SCREEN (Ctrl + L)
    if (e.ctrlKey && e.key === "l") {
      e.preventDefault();
      this.clearScreen();
      showToast("Screen cleared");
      return;
    }

    // 5. CANCEL COMMAND (Ctrl + C)
    if (e.ctrlKey && e.key === "c") {
      e.preventDefault();
      const currentInput = this.input.value;
      this.addOutput(this.prompt.textContent + " " + currentInput + "^C");
      this.input.value = "";
      showToast("Command cancled");
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

  updateGhost(input) {
    // Reset if empty
    if (!input || input.trim() === "") {
      this.ghostInput.innerHTML = "";
      this.currentSuggestion = "";
      return;
    }

    // 1. Search in History (Reverse - Latest first)
    // Avoid exact match (user already typed it)
    const historyMatch = [...this.history]
      .reverse()
      .find((cmd) => cmd.startsWith(input) && cmd !== input);

    // 2. Search in Commands (Fallback)
    // Commands keys nikalo + Aliases
    const commands = Object.keys(this.commands);
    const aliases = Object.keys(
      JSON.parse(localStorage.getItem("userAliases") || "{}")
    );
    const allCmds = [...commands, ...aliases];

    const commandMatch = allCmds.find(
      (cmd) => cmd.startsWith(input) && cmd !== input
    );

    // Priority: History > Command
    const match = historyMatch || commandMatch;

    if (match) {
      this.currentSuggestion = match;
      // HTML Trick: User text invisible + Suggestion visible
      // Note: Hum input value ko safe encode kar rahe hain taaki HTML break na ho
      const invisiblePart = input.replace(/ /g, "&nbsp;");
      const visiblePart = match.slice(input.length);

      this.ghostInput.innerHTML = `<span class="ghost-hidden">${invisiblePart}</span><span class="ghost-suggestion">${visiblePart}</span>`;
    } else {
      this.ghostInput.innerHTML = "";
      this.currentSuggestion = "";
    }
  }

  handleSetupInput(input) {
    // Validation: Empty check
    if (!input) {
      this.addOutput("Error: Username cannot be empty.", "error");
      return;
    }

    // Validation: Space check
    if (input.includes(" ")) {
      this.addOutput("Error: Username cannot contain spaces.", "error");
      this.addOutput("Try format like: user, dev, admin_01", "warning");
      return;
    }

    // Validation: Length check (Optional)
    if (input.length > 15) {
      this.addOutput("Error: Username too long (max 15 chars).", "error");
      return;
    }

    // SAVE & PROCEED
    this.username = input;
    localStorage.setItem("username", input);
    localStorage.setItem("cyber_setup_complete", "true");

    this.addOutput(`\nSuccess! User '${input}' created.`, "success");
    this.addOutput("Initializing user environment...", "info");

    // Delay for effect
    this.isSetupMode = false;
    this.input.disabled = true;

    setTimeout(() => {
      this.input.disabled = false;
      this.clearScreen();
      this.updatePrompt(); // Ab prompt me 'input@cyberterm' dikhega
      this.showWelcome();
      this.loadTips();
      this.input.focus();
    }, 1500);
  }

  // Existing handleInput ko isse replace karein
  handleInput(e) {
    const val = e.target.value;

    // --- SETUP MODE: Prevent Spaces ---
    if (this.isSetupMode) {
      if (val.includes(" ")) {
        this.input.value = val.replace(/\s/g, "");
        if (typeof showToast === "function") {
          showToast("Spaces are not allowed in username!");
        }
      }
    }

    // Normal buffer update
    this.commandBuffer = val;

    // Syntax Highlighting (Existing)
    this.checkSyntax(val);

    // --- GHOST TEXT UPDATE ---
    this.updateGhost(val);
    this.spawnParticles();
  }

  // Ye naya method Terminal class ke andar add karein
  checkSyntax(input) {
    if (!input.trim()) {
      this.input.classList.remove("input-valid", "input-invalid");
      return;
    }

    const firstWord = input.trim().split(" ")[0].toLowerCase();

    // Check against Commands & Aliases
    const aliases = JSON.parse(localStorage.getItem("userAliases") || "{}");
    const isValid = this.commands[firstWord] || aliases[firstWord];

    if (isValid) {
      this.input.classList.add("input-valid");
      this.input.classList.remove("input-invalid");
    } else {
      this.input.classList.add("input-invalid");
      this.input.classList.remove("input-valid");
    }
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
    this.updateFileExplorerWidget();
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

    const storedAliases = JSON.parse(
      localStorage.getItem("userAliases") || "{}"
    );
    if (storedAliases[cmd]) {
      // Alias ki value nikalo (e.g., "ls -la")
      const realCommandStr = storedAliases[cmd];

      // Asli command aur naye arguments ko mix karo
      // Example: Agar alias "ll" = "ls -la" hai aur user "ll /home" type kare
      // To ban jayega: "ls -la /home"
      const fullCommand = realCommandStr + " " + args.join(" ");

      // Recursively execute karo (taaki naye command ko run kiya ja sake)
      this.executeSingleCommand(fullCommand);
      return; // Yahan se return ho jao, aage ka code mat chalao
    }

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
        cp <src> <dest>        Copy file (-r for recursive)
        mv <src> <dest>        Move/rename file or directory
        head <file>            Show first 10 lines (-n for custom)
        tail <file>            Show last 10 lines (-n for custom)
        wc <file>              Count lines, words, characters
      
      SEARCH & FILTER:
        find <pattern>         Find files by name/pattern
        grep "pattern" <file>  Search text in file (-r for dir)
        ls | grep ".txt"       Filter command output
      
      PRODUCTIVITY:
        todo <action>          Manage Todo list (add, list, done, clear)
        note <text>            Save a quick note
        notes list             View saved notes
        timer <time>           Set timer (e.g., 10s, 5m, 1h)
        alarm <HH:MM>          Set alarm (24h format)
        calc <expr>            Evaluate math expression
        passgen [len]          Generate secure password
      
      WEB & SEARCH:
        google <query>         Search Google
        youtube <query>        Search YouTube
        github <query>         Search GitHub
        stackoverflow <query>  Search StackOverflow
        wiki <query>           Search Wikipedia
        map <location>         Open Google Maps
        translate <text>       Translate text (Google)
        open <service>         Open site (gmail, chatgpt, etc.)
        bookmark <action>      Manage custom bookmarks
        quicklink              List all available quick links
        weather <gps>          Get Weather (use 'gps' for local)
        news                   Fetch latest news
        crypto <symbol>        Get crypto prices (BTC, ETH)
        fetch <url>            Fetch URL content (JSON/HTML)
      
      BROWSER CONTROL:
        tabs <action>          Manage tabs (list, switch, close, new, dedup)
        history.browser        Manage browser history (list, search, open)
        download <action>      Manage downloads (list, pause, resume)
      
      SYSTEM & UTILITIES:
        clear                  Clear terminal screen
        history                Show command history
        neofetch               Show system info (ASCII art)
        date / time            Show current date or time
        whoami                 Display current user
        sudo <command>         Execute as superuser (simulation)
        sys.info               Display hardware/software info
        sys.log                Show system logs
        dev.mode.enable        Enable developer debug mode
      
      SETTINGS & SESSION:
        session <action>       Manage sessions (save, load, list)
        theme set <name>       Change theme (matrix, kali, neon-purple)
        set <prop> <val>       Set fontSize, opacity, prompt
        settings <action>      Import/Export/Reset settings
        refresh                Refresh the terminal
        alias <action>         Manage command shortcuts
        shortcut list          View custom keyboard shortcuts
      
      HELP & FUN:
        help [cmd]             Show help menu or specific command info
        man <cmd>              Read detailed manual page
        examples <cmd>         Show usage examples
        tutorial               Start interactive tutorial
        tip                    Get a random terminal tip
        matrix                 Toggle Matrix screen effect
        cowsay <text>          Make the cow speak
      
      CHAINING:
        cmd1 ; cmd2            Execute sequentially
        cmd1 && cmd2           Execute if first succeeds
        cmd1 | cmd2            Pipe output (e.g., ls | grep js)
      
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Use ↑↓ arrows for history | Tab for autocomplete | Ctrl+L to clear
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

          // 1. Get Widget State Manually
          const widgetSection = document.querySelector(".widgets-section");
          const widgetOrder = [...document.querySelectorAll(".widget")].map(
            (w) => w.id
          );
          const isCollapsed = widgetSection.classList.contains("collapsed");

          // Capture current state
          const state = {
            timestamp: new Date().toLocaleString(),
            path: this.currentPath,
            history: this.history,
            user: this.username,
            theme: this.currentTheme,
            particlesEnabled: this.settings.particlesEnabled,
            matrixEnabled: this.settings.matrixEnabled,
            widgetLayout: {
              collapsed: isCollapsed,
              order: widgetOrder,
            },
            // Capture Widget HTML content (Backup)
            weatherWidget: document.getElementById("weather-display")
              ? document.getElementById("weather-display").innerHTML
              : "",
          };

          sessions[name] = state;
          localStorage.setItem("terminalSessions", JSON.stringify(sessions));
          this.addOutput(`💾 Session "${name}" saved successfully.`, "success");
          showToast("Session saved successfully");
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

          if (typeof s.matrixEnabled !== "undefined") {
            this.settings.matrixEnabled = s.matrixEnabled;
            this.saveSettings(); // Global settings update karein
            this.applySettings(); // Visuals update karein
          }

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

          if (typeof s.particlesEnabled !== "undefined") {
            this.settings.particlesEnabled = s.particlesEnabled;
            this.saveSettings(); // Update localStorage
          }

          if (s.widgetLayout) {
            // Update Global Settings (Persistence ke liye)
            this.settings.widgetsCollapsed = s.widgetLayout.collapsed;
            this.settings.widgetOrder = s.widgetLayout.order;
            this.saveSettings();

            // Apply Visuals Immediately
            const sidebar = document.querySelector(".widgets-section");
            const container = document.querySelector(".container");

            if (s.widgetLayout.collapsed) {
              sidebar.classList.add("collapsed");
              container.classList.add("sidebar-closed");
            } else {
              sidebar.classList.remove("collapsed");
              container.classList.remove("sidebar-closed");
            }

            // Re-order DOM
            if (s.widgetLayout.order) {
              const widgetMap = {};
              [...sidebar.querySelectorAll(".widget")].forEach(
                (w) => (widgetMap[w.id] = w)
              );
              s.widgetLayout.order.forEach((id) => {
                if (widgetMap[id]) sidebar.appendChild(widgetMap[id]);
              });
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
            showToast("Session delete successfully");
          } else {
            this.addOutput(`❌ Session "${name}" not found.`, "error");
          }
          break;

        default:
          this.addOutput(`Unknown action: ${action}`, "error");
      }
    },

    // --- SETTINGS & CUSTOMIZATION ---

    set: function (args) {
      if (args.length < 2) {
        this.addOutput("Usage: set <property> <value>", "warning");
        this.addOutput(
          "Properties: fontSize, opacity, prompt, startupCmd, boot",
          "info"
        );
        return;
      }

      const prop = args[0].toLowerCase();
      const val = args.slice(1).join(" ");

      switch (prop) {
        case "fontsize":
          const size = parseInt(val);
          if (isNaN(size) || size < 8 || size > 40) {
            this.addOutput(
              "Error: Font size must be between 8 and 40.",
              "error"
            );
            return;
          }
          this.settings.fontSize = size;
          this.applySettings();
          this.saveSettings();
          this.addOutput(`Font size set to ${size}px`, "success");
          showToast(`Font size set to ${size} px`);
          break;

        case "opacity":
          const op = parseFloat(val);

          // Updated Validation: Ab 0.0 se 1.0 tak allowed hai
          if (isNaN(op) || op < 0.0 || op > 1.0) {
            this.addOutput(
              "Error: Opacity must be between 0.0 and 1.0",
              "error"
            );
            return;
          }

          this.settings.opacity = op;
          this.applySettings();
          this.saveSettings();
          this.addOutput(`Opacity set to ${op}`, "success");
          if (typeof showToast === "function")
            showToast(`Opacity set to ${op}`);
          break;

        case "prompt":
          // "default" likhne par reset kar dega
          if (val === "default") {
            this.settings.customPrompt = null;
            this.addOutput("Prompt reset to default.", "success");
            showToast("Prompt reset to default.");
          } else {
            this.settings.customPrompt = val + " "; // Space add kar diya
            this.addOutput(`Prompt changed to: ${val}`, "success");
            showToast(`Prompt changed to: ${val}`);
          }
          this.updatePrompt();
          this.saveSettings();
          break;

        case "startupcmd":
          this.settings.startupCmd = val === "none" ? null : val;
          this.saveSettings();
          this.addOutput(`Startup command set to: "${val}"`, "success");
          showToast(`Startup command set to: "${val}"`);
          break;

        case "boot":
          if (val === "off" || val === "false") {
            this.settings.skipBoot = true;
            this.saveSettings();
            this.addOutput("🚫 Boot sequence DISABLED.", "success");
            showToast("Boot sequence DISABLED");
          } else if (val === "on" || val === "true") {
            this.settings.skipBoot = false;
            this.saveSettings();
            this.addOutput("✅ Boot sequence ENABLED.", "success");
            showToast("Boot sequence ENABLED");
          } else {
            this.addOutput("Usage: set boot <on|off>", "warning");
          }
          break;

        default:
          this.addOutput(`Unknown setting: ${prop}`, "error");
      }
    },

    refresh: function () {
      this.addOutput("🔄 System refresh initiated...", "warning");
      this.addOutput("Re-establishing connection...", "info");

      if (typeof showToast === "function") {
        showToast("Refreshing page...");
      }

      // 1 second ka delay taaki user message padh sake
      setTimeout(() => {
        location.reload();
      }, 1000);
    },

    // Optional: Agar aap 'reboot' command bhi chahte hain same kaam ke liye
    reboot: function () {
      this.commands.refresh.call(this);
    },

    settings: function (args) {
      const action = args[0];

      if (action === "export") {
        const data = JSON.stringify(this.settings, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "terminal_settings.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        this.addOutput("Settings exported successfully.", "success");
        showToast("Settings exported successfully.");
      } else if (action === "import") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = (e) => {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const newSettings = JSON.parse(event.target.result);
              this.settings = { ...this.settings, ...newSettings };
              this.saveSettings();
              this.applySettings();
              this.updatePrompt();
              this.addOutput("Settings imported successfully!", "success");
              showToast("Settings imported successfully!");
            } catch (err) {
              this.addOutput("Invalid settings file.", "error");
            }
          };
          reader.readAsText(file);
        };
        input.click();
      } else if (action === "reset") {
        localStorage.removeItem("terminalSettings");
        this.addOutput("Settings reset to default. Refreshing...", "warning");
        showToast("Settings reset to default. Refreshing...");
        setTimeout(() => location.reload(), 1000);
      } else {
        this.addOutput("Usage: settings <export|import|reset>", "warning");
      }
    },

    shortcut: function (args) {
      if (args[0] === "list") {
        this.addOutput("Custom Shortcuts:", "info");
        const keys = Object.keys(this.settings.shortcuts);
        if (keys.length === 0) this.addOutput("  (None set)");
        keys.forEach((k) => {
          this.addOutput(`  ${k}  →  ${this.settings.shortcuts[k]}`);
        });
      } else if (args[0] === "set" && args[1] && args[2]) {
        // args[1] = "Ctrl+T", args[2] = "clear"
        const keyCombo = args[1];
        const cmd = args.slice(2).join(" ");
        this.settings.shortcuts[keyCombo] = cmd;
        this.saveSettings();
        this.addOutput(`Shortcut set: ${keyCombo} runs "${cmd}"`, "success");
        showToast(`Shortcut set: ${keyCombo} runs "${cmd}"`);
      } else {
        this.addOutput("Usage:", "warning");
        this.addOutput("  shortcut list");
        this.addOutput('  shortcut set "Ctrl+T" clear');
      }
    },

    // --- PRODUCTIVITY WIDGETS ---

    // 1. QUICK NOTES
    note: function (args) {
      if (args.length === 0) {
        this.addOutput("Usage: note <text>", "warning");
        return;
      }

      const text = args.join(" ");
      const notes = JSON.parse(localStorage.getItem("terminalNotes") || "[]");

      const newNote = {
        id: Date.now(),
        text: text,
        date: new Date().toLocaleString(),
      };

      notes.push(newNote);
      localStorage.setItem("terminalNotes", JSON.stringify(notes));
      this.addOutput("📝 Note saved.", "success");
      showToast("Note saved.");
    },

    notes: function (args) {
      const action = args[0] || "list";
      let notes = JSON.parse(localStorage.getItem("terminalNotes") || "[]");

      if (action === "clear") {
        localStorage.removeItem("terminalNotes");
        this.addOutput("🗑️ All notes cleared.", "success");
        showToast("All notes cleared.");
      } else if (action === "list") {
        if (notes.length === 0) {
          this.addOutput("No notes found.", "info");
        } else {
          this.addOutput("\n📒 QUICK NOTES:", "info");
          notes.forEach((note, index) => {
            this.addOutput(`${index + 1}. ${note.text}`);
            this.addOutput(`   [${note.date}]`, "info"); // Faint date
          });
          this.addOutput("");
        }
      } else {
        this.addOutput("Usage: notes list OR notes clear", "warning");
      }
    },

    // 2. TODO LIST
    todo: function (args) {
      if (args.length === 0) {
        this.addOutput("Usage: todo <add|list|done|clear> [args]", "warning");
        return;
      }

      const action = args[0];
      let todos = JSON.parse(localStorage.getItem("terminalTodos") || "[]");

      switch (action) {
        case "add":
          const task = args.slice(1).join(" ");
          if (!task) {
            this.addOutput("Error: Missing task text.", "error");
            return;
          }
          todos.push({ text: task, completed: false });
          localStorage.setItem("terminalTodos", JSON.stringify(todos));
          this.addOutput(`✅ Added task: "${task}"`, "success");
          showToast(`Added task: "${task}"`);
          break;

        case "list":
          if (todos.length === 0) {
            this.addOutput("No tasks found.", "info");
          } else {
            this.addOutput("\n✅ TODO LIST:", "info");
            todos.forEach((t, i) => {
              const status = t.completed ? "[x]" : "[ ]";
              const style = t.completed ? "success" : ""; // Green if done
              this.addOutput(`${i + 1}. ${status} ${t.text}`, style);
            });
            this.addOutput("");
          }
          break;

        case "done":
          const idx = parseInt(args[1]) - 1;
          if (todos[idx]) {
            todos[idx].completed = true;
            localStorage.setItem("terminalTodos", JSON.stringify(todos));
            this.addOutput(`👍 Marked task ${args[1]} as complete.`, "success");
            showToast(`Marked task ${args[1]} as complete.`);
          } else {
            this.addOutput("❌ Invalid task number.", "error");
          }
          break;

        case "clear":
          // Sirf completed tasks hatayenge, ya user chahe to 'all' clear kare
          const initialLen = todos.length;
          todos = todos.filter((t) => !t.completed); // Keep only incomplete

          if (args[1] === "all") {
            todos = []; // Clear everything
            this.addOutput("🗑️ Todo list completely cleared.", "success");
            showToast("Todo list completely cleared.");
          } else {
            const removed = initialLen - todos.length;
            this.addOutput(
              `🗑️ Cleared ${removed} completed task(s).`,
              "success"
            );
            showToast(`Cleared ${removed} completed task(s)`);
          }

          localStorage.setItem("terminalTodos", JSON.stringify(todos));
          break;

        default:
          this.addOutput(`Unknown todo action: ${action}`, "error");
      }
    },

    // --- TIMER WIDGETS ---

    timer: function (args) {
      const cmd = args[0];

      if (cmd === "stop") {
        if (this.activeTimer) {
          clearInterval(this.activeTimer);
          this.activeTimer = null;
          this.addOutput("🛑 Timer stopped.", "warning");
          showToast("Timer stopped.");
        } else {
          this.addOutput("No active timer found.", "info");
        }
        return;
      }

      // Parse time (e.g., "25m", "10s", "1h")
      const timeStr = args[0];
      if (!timeStr) {
        this.addOutput(
          "Usage: timer <duration> (e.g., 10s, 5m, 1h)",
          "warning"
        );
        return;
      }

      const match = timeStr.match(/^(\d+)([smh])$/);
      if (!match) {
        this.addOutput("Invalid format. Use 10s, 5m, or 1h.", "error");
        return;
      }

      const amount = parseInt(match[1]);
      const unit = match[2];
      let durationMs = 0;

      if (unit === "s") durationMs = amount * 1000;
      else if (unit === "m") durationMs = amount * 60 * 1000;
      else if (unit === "h") durationMs = amount * 60 * 60 * 1000;

      this.addOutput(
        `⏳ Timer set for ${timeStr}. I'll notify you when done.`,
        "success"
      );
      showToast(`Timer set for ${timeStr}`);

      // Clear existing timer if any
      if (this.activeTimer) clearInterval(this.activeTimer);

      const startTime = Date.now();
      const endTime = startTime + durationMs;

      // Start Interval
      this.activeTimer = setInterval(() => {
        const timeLeft = endTime - Date.now();

        if (timeLeft <= 0) {
          clearInterval(this.activeTimer);
          this.activeTimer = null;

          // ALARM SOUND & NOTIFICATION
          this.addOutput("⏰ TIMER FINISHED!", "success");
          this.addOutput("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "warning");
          showToast("TIMER FINISHED!");

          // Audio Beep Simulation
          const audio = new AudioContext(); // Modern browsers support this
          const osc = audio.createOscillator();
          osc.connect(audio.destination);
          osc.start();
          setTimeout(() => osc.stop(), 500); // Beep for 0.5 sec

          alert("⏰ Timer Finished!"); // Browser alert popup
        }
      }, 1000);
    },

    alarm: function (args) {
      if (!args[0]) {
        this.addOutput("Usage: alarm HH:MM (24-hour format)", "warning");
        return;
      }

      const targetTimeParts = args[0].split(":");
      if (targetTimeParts.length !== 2) {
        this.addOutput("Invalid format. Use HH:MM (e.g., 14:30)", "error");
        return;
      }

      const now = new Date();
      const target = new Date();
      target.setHours(parseInt(targetTimeParts[0]));
      target.setMinutes(parseInt(targetTimeParts[1]));
      target.setSeconds(0);

      // Agar time beet chuka hai, to agle din ka alarm set karein
      if (target < now) {
        target.setDate(target.getDate() + 1);
      }

      const timeToWait = target - now;
      const hoursLeft = Math.floor(timeToWait / (1000 * 60 * 60));
      const minutesLeft = Math.floor(
        (timeToWait % (1000 * 60 * 60)) / (1000 * 60)
      );

      this.addOutput(
        `🔔 Alarm set for ${args[0]} (in ${hoursLeft}h ${minutesLeft}m).`,
        "success"
      );
      showToast(`Alarm set for ${args[0]}`);

      if (this.activeAlarm) clearTimeout(this.activeAlarm);

      this.activeAlarm = setTimeout(() => {
        this.addOutput("🔔 ALARM RINGING!", "success");
        this.addOutput("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "warning");
        showToast("ALARM RINGING!");

        // Audio Beep
        try {
          const audio = new AudioContext();
          const osc = audio.createOscillator();
          osc.frequency.value = 800; // High pitch
          osc.connect(audio.destination);
          osc.start();
          setTimeout(() => osc.stop(), 1000);
        } catch (e) {}

        alert(`🔔 Alarm: It is ${args[0]}!`);
      }, timeToWait);
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
      showToast("Screen cleared");
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
        showToast("History cleared");
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
        showToast(`Created file: ${args[0]}`);
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
        showToast(`Removed: ${args[0]}`);
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
        showToast(`Created directory: ${args[0]}`);
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
        showToast(`Removed directory: ${args[0]}`);
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
          showToast(`Copied directory: ${source} → ${destination}`);
        } else {
          fileSystem.copyFile(this.currentPath, source, destination);
          this.addOutput(`Copied: ${source} → ${destination}`, "success");
          showToast(`Copied: ${source} → ${destination}`);
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
          showToast(`Renamed: ${source} → ${destination}`);
        } else {
          fileSystem.moveFile(this.currentPath, source, destination);
          this.addOutput(`Moved: ${source} → ${destination}`, "success");
          showToast(`Moved: ${source} → ${destination}`);
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
          showToast(`Theme changed to: ${themeName}`);
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

    // --- UPDATED COMMANDS ---

    open: function (args) {
      if (args.length === 0) {
        this.addOutput("Usage: open <name>", "warning");
        this.addOutput("Opens a service or saved bookmark.", "info");
        return;
      }

      const name = args[0].toLowerCase(); // Case insensitive lookup

      // 1. Check System Services
      if (this.services[name]) {
        const url = this.services[name];
        this.addOutput(`Opening Service: ${name}...`, "success");
        if (typeof showToast === "function") showToast(`Opening ${name}...`);
        window.open(url, "_blank");
        return;
      }

      // 2. Check User Bookmarks
      const bookmarks = JSON.parse(
        localStorage.getItem("userBookmarks") || "{}"
      );
      // Bookmark names might be case sensitive depending on how you saved them,
      // but let's try direct match first, then lowercase match
      let targetUrl =
        bookmarks[name] ||
        bookmarks[Object.keys(bookmarks).find((k) => k.toLowerCase() === name)];

      if (targetUrl) {
        this.addOutput(`Opening Bookmark: ${name}...`, "success");
        if (typeof showToast === "function") showToast(`Opening ${name}...`);
        window.open(targetUrl, "_blank");
        return;
      }

      // 3. Not Found
      this.addOutput(
        `Error: '${name}' not found in services or bookmarks.`,
        "error"
      );
      this.addOutput(
        "Type 'quicklink' for services or 'bookmark list' for bookmarks.",
        "warning"
      );
    },

    quicklink: function (args) {
      const keys = Object.keys(this.services);

      if (keys.length === 0) {
        this.addOutput(
          "No services loaded or services.json is empty.",
          "warning"
        );
        return;
      }

      this.addOutput("\n🔗 AVAILABLE QUICK LINKS:", "info");
      this.addOutput("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      // Grid layout logic or Simple List
      // Yahan hum neat list formatting kar rahe hain

      // Agar user ne 'search' term diya hai: e.g., quicklink google
      const filter = args[0] ? args[0].toLowerCase() : null;

      let count = 0;
      keys.sort().forEach((key) => {
        if (filter && !key.includes(filter)) return;

        const url = this.services[key];
        // Formatting: Name (padded) -> URL
        // padEnd(20) ensure karega ki sab ek line me dikhe
        this.addOutput(`${key.padEnd(18)} →  ${url}`);
        count++;
      });

      this.addOutput("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      this.addOutput(`Total: ${count} services found.`, "info");
      this.addOutput("Usage: open <name> to launch.", "warning");
    },

    // --- SEARCH ENGINES & GOOGLE APPS ---
    google: function (args) {
      if (args.length === 0) {
        this.addOutput("Usage: google <query>", "warning");
        return;
      }
      const query = args.join(" ");
      this.addOutput(`Searching Google for: "${query}"...`, "success");
      showToast(`Searching Google for: "${query}"...`);
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
      showToast(`Searching YouTube for: "${query}"...`);
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
      showToast(`Searching GitHub for: "${query}"...`);
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
      showToast(`Searching StackOverflow for: "${query}"...`);
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
      showToast(`Searching Wikipedia for: "${query}"...`);
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
      showToast(`Opening Maps for: "${location}"...`);
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
      showToast(`Translating "${textToTranslate}"...`);
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
        showToast("Getting GPS location...");

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            this.addOutput(
              `GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
              "success"
            );
            this.addOutput("Fetching weather data...", "info");
            showToast("Fetching weather data...");

            const apiKey = "794f3ea37db442de8f642856250712";

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
      showToast("Fetching weather data from GPS...");
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
      showToast(`Fetching ${symbol} price...`);

      apiManager.getCryptoPrice(symbol).then((price) => {
        if (price) {
          this.addOutput(`${symbol}: $${price}`, "success");
          showToast(`${symbol}: $${price}`);
        }
      });
    },

    news: function () {
      this.addOutput("Fetching latest news...", "info");
      showToast("Fetching latest news...");
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
      showToast("Fetching quote...");
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
      showToast("Developer mode enabled");
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
      // 1. Toggle the setting
      this.settings.matrixEnabled = !this.settings.matrixEnabled;

      // 2. Apply Visual Change
      const canvas = document.getElementById("matrix-canvas");
      if (canvas) {
        canvas.style.opacity = this.settings.matrixEnabled ? "0.7" : "0";
      }

      // 3. Save to LocalStorage (Taaki refresh ke baad yaad rahe)
      this.saveSettings();

      // 4. Feedback
      const status = this.settings.matrixEnabled ? "enabled" : "disabled";
      this.addOutput(`Matrix effect ${status}.`, "success");

      if (typeof showToast === "function") {
        showToast(`Matrix effect ${status}`);
      }
    },

    calc: function (args) {
      if (args.length === 0) {
        this.addOutput("Usage: calc <expression>", "warning");
        this.addOutput("Example: calc 10 + 5 * 2", "info");
        return;
      }

      try {
        // Space hata kar expression join karein
        const expression = args.join("");

        // --- Safe Math Evaluator (No eval) ---
        const safeEval = (expr) => {
          // Invalid chars check
          if (/[^0-9+\-*/().]/.test(expr))
            throw new Error("Invalid characters");

          const ops = [];
          const values = [];

          const precedence = (op) => {
            if (op === "+" || op === "-") return 1;
            if (op === "*" || op === "/") return 2;
            return 0;
          };

          const applyOp = () => {
            const b = parseFloat(values.pop());
            const a = parseFloat(values.pop());
            const op = ops.pop();
            if (op === "+") values.push(a + b);
            else if (op === "-") values.push(a - b);
            else if (op === "*") values.push(a * b);
            else if (op === "/") values.push(a / b);
          };

          // Tokenizer: Numbers aur Operators alag karein
          const tokens = expr.match(/(\d+(\.\d+)?|[\+\-\*\/\(\)])/g);
          if (!tokens) throw new Error("Empty expression");

          for (let token of tokens) {
            if (!isNaN(parseFloat(token))) {
              values.push(token);
            } else if (token === "(") {
              ops.push(token);
            } else if (token === ")") {
              while (ops.length && ops[ops.length - 1] !== "(") applyOp();
              ops.pop();
            } else if (["+", "-", "*", "/"].includes(token)) {
              while (
                ops.length &&
                precedence(ops[ops.length - 1]) >= precedence(token)
              ) {
                applyOp();
              }
              ops.push(token);
            }
          }
          while (ops.length) applyOp();
          return values[0];
        };
        // -------------------------------------

        const result = safeEval(expression);

        if (result === undefined || isNaN(result) || !isFinite(result)) {
          throw new Error("Calculation failed");
        }

        this.addOutput(`${args.join(" ")} = ${result}`, "success");
      } catch (e) {
        this.addOutput(`Error: ${e.message}`, "error");
      }
    },

    bookmark: function (args) {
      if (args.length === 0) {
        this.addOutput("Usage: bookmark <action> [args]", "warning");
        this.addOutput("Actions: add, remove, list, open", "info");
        return;
      }

      const action = args[0];
      const name = args[1];
      const urlInput = args[2];

      let bookmarks = JSON.parse(localStorage.getItem("userBookmarks") || "{}");

      // --- HELPER: URL Normalizer for Smart Comparison ---
      const normalizeUrl = (url) => {
        try {
          const fullUrl = url.startsWith("http") ? url : `https://${url}`;
          const urlObj = new URL(fullUrl);
          // Remove 'www.' and trailing slash for cleaner comparison
          return (
            urlObj.hostname.replace(/^www\./, "") + urlObj.pathname
          ).replace(/\/$/, "");
        } catch (e) {
          return url.replace(/\/$/, ""); // Fallback
        }
      };

      if (action === "add") {
        if (!name || !urlInput) {
          this.addOutput("Error: Name and URL are required.", "error");
          return;
        }

        const finalUrl = urlInput.startsWith("http")
          ? urlInput
          : `https://${urlInput}`;
        const cleanInputUrl = normalizeUrl(finalUrl);

        // 1. Check in Services (Smart Detect)
        let existingService = null;
        for (const [svcName, svcUrl] of Object.entries(this.services)) {
          if (normalizeUrl(svcUrl) === cleanInputUrl) {
            existingService = svcName;
            break;
          }
        }

        if (existingService) {
          this.addOutput(`⚠️ URL match found in System Services!`, "warning");
          this.addOutput(`Already exists as: '${existingService}'`, "info");
          this.addOutput(
            `Use 'open ${existingService}' to launch it.`,
            "success"
          );
          return;
        }

        // 2. Check in Existing Bookmarks (Smart Detect)
        let existingBookmark = null;
        for (const [bkName, bkUrl] of Object.entries(bookmarks)) {
          if (normalizeUrl(bkUrl) === cleanInputUrl) {
            existingBookmark = bkName;
            break;
          }
        }

        if (existingBookmark) {
          this.addOutput(
            `⚠️ Bookmark already exists as '${existingBookmark}'`,
            "warning"
          );
          return;
        }

        bookmarks[name] = finalUrl;
        localStorage.setItem("userBookmarks", JSON.stringify(bookmarks));
        this.addOutput(`🔖 Bookmark saved: ${name} -> ${finalUrl}`, "success");
        if (typeof showToast === "function") showToast("Bookmark saved");
      } else if (action === "remove") {
        if (!name) return this.addOutput("Error: Name required.", "error");

        if (bookmarks[name]) {
          delete bookmarks[name];
          localStorage.setItem("userBookmarks", JSON.stringify(bookmarks));
          this.addOutput(`🗑️ Bookmark '${name}' removed.`, "success");
        } else {
          this.addOutput(`Error: Bookmark '${name}' not found.`, "error");
        }
      } else if (action === "list") {
        const keys = Object.keys(bookmarks);
        if (keys.length === 0) {
          this.addOutput("No custom bookmarks found.", "info");
        } else {
          this.addOutput("\n🔖 YOUR BOOKMARKS:", "info");
          this.addOutput("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          keys.forEach((k) =>
            this.addOutput(`${k.padEnd(20)} -> ${bookmarks[k]}`)
          );
          this.addOutput("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        }
      } else if (action === "open") {
        // Redirect to main open command
        this.commands.open.call(this, [name]);
      } else {
        this.addOutput(`Unknown action: ${action}`, "error");
      }
    },

    passgen: function (args) {
      // Usage check: Agar user ne length nahi di
      if (args.length === 0) {
        this.addOutput("Usage: passgen <length>", "warning");
        this.addOutput("Example: passgen 16", "info");
        return;
      }

      const length = parseInt(args[0]);

      if (isNaN(length) || length < 4 || length > 128) {
        this.addOutput("Error: Length must be between 4 and 128.", "error");
        return;
      }

      const charset =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
      let password = "";

      // Random password generation
      for (let i = 0, n = charset.length; i < length; ++i) {
        password += charset.charAt(Math.floor(Math.random() * n));
      }

      this.addOutput(`🔑 Generated Password (${length} chars):`, "info");
      this.addOutput(password, "success");

      // Auto copy to clipboard
      if (navigator.clipboard) {
        navigator.clipboard
          .writeText(password)
          .then(() => {
            if (typeof showToast === "function")
              showToast("Password copied to clipboard!");
          })
          .catch(() => {});
      }
    },

    alias: function (args) {
      // Usage check
      if (args.length === 0) {
        this.addOutput("Usage: alias <action> [args]", "warning");
        this.addOutput("Actions:", "info");
        this.addOutput(
          "  set <name> <command>  - Create a shortcut (e.g., alias set ll ls -la)"
        );
        this.addOutput("  remove <name>         - Remove a shortcut");
        this.addOutput("  list                  - Show all aliases");
        return;
      }

      const action = args[0];

      let aliases = JSON.parse(localStorage.getItem("userAliases") || "{}");

      if (action === "set") {
        if (args.length < 3) {
          this.addOutput("Usage: alias set <name> <command string>", "error");
          return;
        }
        const name = args[1];
        // Baaki ke saare arguments ko jodkar command banao
        const cmd = args.slice(2).join(" ");

        // Reserved commands ko overwrite hone se bachayein (Optional safety)
        if (this.commands[name]) {
          this.addOutput(
            `Warning: '${name}' is a system command. Overriding it might cause issues.`,
            "warning"
          );
        }

        aliases[name] = cmd;
        localStorage.setItem("userAliases", JSON.stringify(aliases));
        this.addOutput(`🔗 Alias set: '${name}' -> '${cmd}'`, "success");
        if (typeof showToast === "function") showToast("Alias saved");
      } else if (action === "list") {
        const keys = Object.keys(aliases);
        if (keys.length === 0) {
          this.addOutput("No custom aliases found.", "info");
        } else {
          this.addOutput("\n🔗 CUSTOM ALIASES:", "info");
          this.addOutput("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          keys.forEach((k) => {
            this.addOutput(`${k.padEnd(10)} = ${aliases[k]}`);
          });
          this.addOutput("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        }
      } else if (action === "remove") {
        const name = args[1];
        if (!name) {
          this.addOutput("Error: Alias name required.", "error");
          return;
        }
        if (aliases[name]) {
          delete aliases[name];
          localStorage.setItem("userAliases", JSON.stringify(aliases));
          this.addOutput(`Alias '${name}' removed.`, "success");
          if (typeof showToast === "function") showToast("Alias removed");
        } else {
          this.addOutput(`Error: Alias '${name}' not found.`, "error");
        }
      } else {
        this.addOutput(`Unknown action: ${action}`, "error");
      }
    },

    fetch: function (args) {
      if (args.length === 0) {
        this.addOutput("Usage: fetch <url> [-m method]", "warning");
        return;
      }

      let url = args[0];
      if (!url.startsWith("http")) url = "https://" + url;

      this.addOutput(`Fetching ${url}...`, "info");

      fetch(url)
        .then(async (response) => {
          const statusColor = response.ok ? "success" : "error";
          this.addOutput(
            `Status: ${response.status} ${response.statusText}`,
            statusColor
          );

          const contentType = response.headers.get("content-type");

          if (contentType && contentType.includes("application/json")) {
            const jsonData = await response.json();
            // Format JSON nicely
            const lines = JSON.stringify(jsonData, null, 2).split("\n");
            lines.forEach((line) => {
              // Replace spaces with non-breaking spaces for indentation
              this.addOutput(line.replace(/ /g, "\u00a0"), "info");
            });
          } else {
            const textData = await response.text();
            // Show only first 500 chars to avoid flooding terminal
            this.addOutput(
              textData.substring(0, 500) + (textData.length > 500 ? "..." : ""),
              "info"
            );
          }
        })
        .catch((error) => {
          this.addOutput(`Error: ${error.message}`, "error");
        });
    },

    tabs: function (args) {
      // 1. Chrome API Check
      if (typeof chrome === "undefined" || !chrome.tabs) {
        this.addOutput("Error: Chrome Tabs API is not available.", "error");
        this.addOutput("Ensure 'tabs' permission is in manifest.json", "info");
        return;
      }

      if (args.length === 0) {
        this.addOutput("Usage: tabs <action> [args]", "warning");
        this.addOutput(
          "Actions: list, switch, new, close, reload, pin/unpin, mute/unmute, discard, dedup",
          "info"
        );
        return;
      }

      const action = args[0].toLowerCase();
      const targetArgs = args.slice(1);

      // --- HELPER: Auto-Fetch Tabs ---
      const withTabs = (callback) => {
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            this.addOutput(
              `Error: ${chrome.runtime.lastError.message}`,
              "error"
            );
            return;
          }
          this.tabListCache = tabs.map((t) => t.id);
          callback(tabs);
        });
      };

      // --- HELPER: Process Target Arguments (Supports "all", "1 3 5", "1-5") ---
      const getTargets = (tabs, argList) => {
        if (argList.length === 0)
          return { valid: [], invalid: [], isAll: false };

        if (argList[0].toLowerCase() === "all") {
          return { valid: tabs, invalid: [], isAll: true };
        }

        const valid = [];
        const invalid = [];

        argList.forEach((arg) => {
          // 1. Check for Range (e.g., "1-5")
          if (arg.includes("-")) {
            const parts = arg.split("-").map((n) => parseInt(n));
            const start = Math.min(parts[0], parts[1]);
            const end = Math.max(parts[0], parts[1]);

            if (!isNaN(start) && !isNaN(end)) {
              for (let i = start; i <= end; i++) {
                if (i >= 1 && i <= tabs.length) {
                  valid.push(tabs[i - 1]);
                } else {
                  invalid.push(i.toString());
                }
              }
            } else {
              invalid.push(arg); // Invalid range format
            }
          }
          // 2. Check for Single Number (e.g., "1")
          else {
            const sn = parseInt(arg);
            if (isNaN(sn) || sn < 1 || sn > tabs.length) {
              invalid.push(arg);
            } else {
              valid.push(tabs[sn - 1]);
            }
          }
        });

        // Remove duplicates from valid list (in case of overlap like "1-3 2")
        const uniqueValid = [...new Set(valid)];
        return { valid: uniqueValid, invalid, isAll: false };
      };

      // ===========================
      // 1. LIST TABS
      // ===========================
      if (action === "list") {
        const query = targetArgs.join(" ").toLowerCase();

        withTabs((tabs) => {
          if (!tabs || tabs.length === 0) {
            this.addOutput("No open tabs found.", "warning");
            return;
          }

          const displayTabs = query
            ? tabs.filter(
                (t) =>
                  (t.title && t.title.toLowerCase().includes(query)) ||
                  (t.url && t.url.toLowerCase().includes(query))
              )
            : tabs;

          if (displayTabs.length === 0) {
            this.addOutput(`No tabs found matching '${query}'.`, "warning");
            return;
          }

          this.addOutput(
            `\n🖥️ OPEN TABS (${displayTabs.length}/${tabs.length}):`,
            "info"
          );
          this.addOutput(
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          );
          this.addOutput("SN. | STS | PIN | MEM | TITLE");
          this.addOutput(
            "────┼─────┼─────┼─────┼───────────────────────────────────"
          );

          displayTabs.forEach((tab) => {
            const originalIndex = tabs.findIndex((t) => t.id === tab.id);
            const sn = (originalIndex + 1).toString().padEnd(3);
            const statusIcon = tab.active ? "🟢" : "⚪";
            const pinIcon = tab.pinned ? "📌" : "  ";
            const memIcon = tab.discarded ? "💤" : "⚡";
            let rawTitle = tab.title || "Untitled Tab";
            const title =
              rawTitle.length > 40
                ? rawTitle.substring(0, 37) + "..."
                : rawTitle;

            this.addOutput(
              `${sn} | ${statusIcon}  | ${pinIcon}  | ${memIcon}  | ${title}`,
              tab.active ? "success" : ""
            );
          });
          this.addOutput(
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          );
          if (query) this.addOutput(`Filtered by: "${query}"`, "info");
        });
      }

      // ===========================
      // 2. NEW TAB
      // ===========================
      else if (action === "new") {
        if (targetArgs.length === 0) {
          chrome.tabs.create({});
          this.addOutput("New blank tab opened.", "success");
          return;
        }

        const tasks = [];
        let i = 0;
        while (i < targetArgs.length) {
          const current = targetArgs[i];
          const next = targetArgs[i + 1];

          if (!isNaN(parseInt(current)) && !current.includes(".")) {
            const count = parseInt(current);
            if (next && (isNaN(parseInt(next)) || next.includes("."))) {
              tasks.push({ count: count, url: next });
              i += 2;
            } else {
              tasks.push({ count: count, url: undefined });
              i += 1;
            }
          } else {
            tasks.push({ count: 1, url: current });
            i += 1;
          }
        }

        let totalCreated = 0;
        tasks.forEach((task) => {
          let finalUrl = task.url;
          if (finalUrl) {
            const lowerKey = finalUrl.toLowerCase();
            if (this.services && this.services[lowerKey]) {
              finalUrl = this.services[lowerKey];
            } else if (!finalUrl.startsWith("http")) {
              finalUrl = "https://" + finalUrl;
            }
          }
          for (let k = 0; k < task.count; k++) {
            chrome.tabs.create({ url: finalUrl, active: false });
            totalCreated++;
          }
        });
        this.addOutput(`🚀 Opened ${totalCreated} new tab(s).`, "success");
      }

      // ===========================
      // 3. SWITCH TAB
      // ===========================
      else if (action === "switch" || action === "goto") {
        if (targetArgs.length === 0) {
          this.addOutput("Error: SN required. Example: tabs switch 2", "error");
          return;
        }
        withTabs((tabs) => {
          const { valid } = getTargets(tabs, [targetArgs[0]]);
          if (valid.length > 0) {
            chrome.tabs.update(valid[0].id, { active: true });
          } else {
            this.addOutput(`Error: Invalid SN ${targetArgs[0]}`, "error");
          }
        });
      }

      // ===========================
      // 4. DEDUP
      // ===========================
      else if (action === "dedup" || action === "cleanup") {
        withTabs((tabs) => {
          const seenUrls = new Set();
          const duplicates = [];
          tabs.forEach((tab) => {
            if (seenUrls.has(tab.url)) duplicates.push(tab.id);
            else seenUrls.add(tab.url);
          });

          if (duplicates.length > 0) {
            chrome.tabs.remove(duplicates, () => {
              this.addOutput(
                `🧹 Closed ${duplicates.length} duplicate tab(s).`,
                "success"
              );
            });
          } else {
            this.addOutput("✨ No duplicate tabs found.", "success");
          }
        });
      }

      // ===========================
      // 5. BULK ACTIONS (Supports Ranges)
      // ===========================
      else if (
        [
          "close",
          "reload",
          "pin",
          "unpin",
          "mute",
          "unmute",
          "discard",
        ].includes(action)
      ) {
        if (targetArgs.length === 0) {
          this.addOutput(`Usage: tabs ${action} <sn | 1-5 | all>`, "warning");
          return;
        }

        withTabs((tabs) => {
          const { valid, isAll, invalid } = getTargets(tabs, targetArgs);

          if (action === "close") {
            if (isAll) {
              this.addOutput(
                `⚠️ Closing ALL ${valid.length} tabs...`,
                "warning"
              );
              setTimeout(() => chrome.tabs.remove(valid.map((t) => t.id)), 500);
              return;
            }
            if (valid.length) {
              chrome.tabs.remove(
                valid.map((t) => t.id),
                () => {
                  this.addOutput(
                    `🗑️ Closed ${valid.length} tab(s).`,
                    "success"
                  );
                }
              );
            }
          } else if (action === "reload") {
            valid.forEach((t) => chrome.tabs.reload(t.id));
            this.addOutput(`🔄 Reloaded ${valid.length} tabs.`, "success");
          } else if (action === "pin" || action === "unpin") {
            const state = action === "pin";
            valid.forEach((t) => chrome.tabs.update(t.id, { pinned: state }));
            this.addOutput(
              `📌 ${state ? "Pinned" : "Unpinned"} ${valid.length} tabs.`,
              "success"
            );
          } else if (action === "mute" || action === "unmute") {
            const state = action === "mute";
            valid.forEach((t) => chrome.tabs.update(t.id, { muted: state }));
            this.addOutput(
              `${state ? "Muted" : "Unmuted"} ${valid.length} tabs.`,
              "success"
            );
          } else if (action === "discard") {
            let count = 0;
            valid.forEach((t) => {
              if (!t.active && !t.discarded) {
                chrome.tabs.discard(t.id);
                count++;
              }
            });
            this.addOutput(
              `💤 Discarded ${count} tabs to save RAM.`,
              count > 0 ? "success" : "warning"
            );
          }

          if (invalid.length) {
            this.addOutput(
              `Skipped invalid SNs: ${invalid.join(", ")}`,
              "warning"
            );
          }
        });
      } else {
        this.addOutput(
          `Unknown action: '${action}'. Try 'tabs list'.`,
          "error"
        );
      }
    },

    "history.browser": function (args) {
      if (typeof chrome === "undefined" || !chrome.history) {
        this.addOutput("Error: History API access denied.", "error");
        return;
      }

      const action = args[0] ? args[0].toLowerCase() : "list";
      const params = args.slice(1); // Grab all params to support ranges

      // --- HELPER: Ensure History Cache & Auto-Fetch ---
      const withHistory = (callback) => {
        if (this.historyCache && this.historyCache.length > 0) {
          callback(this.historyCache);
        } else {
          chrome.history.search({ text: "", maxResults: 20 }, (results) => {
            this.historyCache = results;
            callback(results);
          });
        }
      };

      // --- HELPER: Resolve Ranges for History (e.g. 1-5, 2) ---
      const resolveHistoryTargets = (inputs, cache) => {
        let targets = [];
        inputs.forEach((arg) => {
          if (arg.includes("-")) {
            const [start, end] = arg.split("-").map((n) => parseInt(n));
            const low = Math.min(start, end);
            const high = Math.max(start, end);
            for (let i = low; i <= high; i++) {
              if (cache[i - 1]) targets.push(cache[i - 1]);
            }
          } else {
            const sn = parseInt(arg);
            if (!isNaN(sn) && cache[sn - 1]) targets.push(cache[sn - 1]);
          }
        });
        return [...new Set(targets)]; // Remove duplicates
      };

      // --- ACTION: CLEAR ALL ---
      if (action === "clear") {
        this.addOutput("Clearing ALL browser history...", "warning");
        chrome.history.deleteAll(() => {
          this.addOutput("✔ Browser history wiped clean.", "success");
          this.historyCache = [];
        });
        return;
      }

      // --- ACTION: STATS ---
      if (action === "stats") {
        this.addOutput("Analyzing browsing habits...", "info");
        chrome.history.search({ text: "", maxResults: 1000 }, (results) => {
          const domainCounts = {};
          results.forEach((item) => {
            try {
              const url = new URL(item.url);
              const domain = url.hostname.replace("www.", "");
              domainCounts[domain] = (domainCounts[domain] || 0) + 1;
            } catch (e) {}
          });
          const sorted = Object.entries(domainCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
          this.addOutput("\n📊 TOP 10 VISITED SITES:", "info");
          this.addOutput("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          sorted.forEach(([domain, count], index) => {
            this.addOutput(
              `${(index + 1).toString().padEnd(2)} | ${domain.padEnd(
                20
              )} | ${count} visits`,
              "success"
            );
          });
          this.addOutput("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        });
        return;
      }

      // --- ACTION: OPEN (With Range Support) ---
      if (action === "open" || action === "goto") {
        if (params.length === 0) {
          this.addOutput("Usage: history.browser open <sn | 1-5>", "warning");
          return;
        }

        withHistory((items) => {
          const targets = resolveHistoryTargets(params, items);
          if (targets.length === 0) {
            this.addOutput("Error: Invalid SN(s). Run list first.", "error");
            return;
          }

          this.addOutput(`Opening ${targets.length} items...`, "success");
          targets.forEach((item) => {
            chrome.tabs.create({ url: item.url, active: false });
          });
        });
        return;
      }

      // --- ACTION: REMOVE (With Range Support) ---
      if (action === "rm" || action === "delete") {
        if (params.length === 0) {
          this.addOutput("Usage: history.browser rm <sn | 1-5>", "warning");
          return;
        }

        withHistory((items) => {
          const targets = resolveHistoryTargets(params, items);
          if (targets.length === 0) {
            this.addOutput("Error: Invalid SN(s).", "error");
            return;
          }

          let count = 0;
          targets.forEach((item) => {
            chrome.history.deleteUrl({ url: item.url });
            count++;
          });
          this.addOutput(`🗑 Removed ${count} items from history.`, "success");
        });
        return;
      }

      // --- ACTION: LIST / SEARCH ---
      let query = "";
      let limit = 20;

      if (action === "search") {
        query = args.slice(1).join(" ");
      } else if (action === "list") {
        if (params[0] && !isNaN(parseInt(params[0])))
          limit = parseInt(params[0]);
      } else {
        this.addOutput(
          "Usage: history.browser [list <n> | search <txt> | open <range> | rm <range> | stats]",
          "warning"
        );
        return;
      }

      this.addOutput(
        query ? `Searching: "${query}"...` : `Fetching last ${limit} items...`,
        "info"
      );

      chrome.history.search({ text: query, maxResults: limit }, (results) => {
        if (!results || results.length === 0) {
          this.addOutput("No history found.", "warning");
          return;
        }

        this.historyCache = results;

        this.addOutput("\n🕒 BROWSER HISTORY:", "info");
        this.addOutput(
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        );
        this.addOutput("SN. | DATE       | TIME  | TITLE");
        this.addOutput(
          "────┼────────────┼───────┼────────────────────────────────────────────"
        );

        const todayDate = new Date().toLocaleDateString();

        results.forEach((item, index) => {
          const sn = (index + 1).toString().padEnd(3);
          const dateObj = new Date(item.lastVisitTime);
          let displayDate =
            dateObj.toLocaleDateString() === todayDate
              ? "Today"
              : dateObj.toLocaleDateString();
          displayDate = displayDate.padEnd(10);
          const timeStr = dateObj.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          let title = item.title || item.url || "Unknown";
          if (title.length > 50) title = title.substring(0, 47) + "...";
          this.addOutput(
            `${sn} | ${displayDate} | ${timeStr} | ${title}`,
            "warning"
          );
        });
        this.addOutput(
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        );
      });
    },

    download: function (args) {
      if (typeof chrome === "undefined" || !chrome.downloads) {
        this.addOutput("Error: Downloads API access denied.", "error");
        return;
      }

      const action = args[0] ? args[0].toLowerCase() : "list";

      const formatBytes = (bytes, decimals = 2) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (
          parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) +
          " " +
          sizes[i]
        );
      };

      // --- HELPER: Monitor Logic (The Re-usable Display) ---
      const monitorDownload = (id) => {
        // 1. Unique Token Print karein
        const uniqueToken = `>> DL_MONITOR_ID:${id}-${Date.now()} <<`;
        this.addOutput(uniqueToken, "info");

        // 2. Element Hijack
        setTimeout(() => {
          const terminal =
            document.getElementById("terminal") ||
            document.querySelector(".output") ||
            document.body;

          // Find the element containing our token
          const allLines = terminal.querySelectorAll("*");
          let targetElement = null;

          // Search backwards for efficiency
          for (let i = allLines.length - 1; i >= 0; i--) {
            if (
              allLines[i].innerText &&
              allLines[i].innerText.includes(uniqueToken)
            ) {
              targetElement = allLines[i];
              break;
            }
          }

          if (!targetElement) return;

          // 3. Live Update Loop
          let lastBytes = 0;
          let lastTime = Date.now();

          const interval = setInterval(() => {
            // Check if element still exists (handled 'clear')
            if (!document.body.contains(targetElement)) {
              clearInterval(interval);
              return;
            }

            chrome.downloads.search({ id: id }, (results) => {
              const item = results[0];

              if (!item || item.state !== "in_progress") {
                clearInterval(interval);
                if (item && item.state === "complete") {
                  targetElement.innerHTML = `<span class="success">✔ Done: ${item.filename
                    .split(/[/\\]/)
                    .pop()} (${formatBytes(item.totalBytes)})</span>`;
                } else if (item && item.state === "interrupted") {
                  targetElement.innerHTML = `<span class="error">✘ Failed/Cancelled</span>`;
                }
                return;
              }

              // Speed Calc
              const now = Date.now();
              const timeDiff = (now - lastTime) / 1000;
              let speed = "0 B/s";

              if (timeDiff > 0.8) {
                const bytesDiff = item.bytesReceived - lastBytes;
                const speedBytes = bytesDiff / timeDiff;
                speed = formatBytes(speedBytes) + "/s";
                lastBytes = item.bytesReceived;
                lastTime = now;
              }

              const percent =
                item.totalBytes > 0
                  ? Math.round((item.bytesReceived / item.totalBytes) * 100)
                  : 0;
              const received = formatBytes(item.bytesReceived);
              const total =
                item.totalBytes > 0 ? formatBytes(item.totalBytes) : "?";

              let filename = item.filename.split(/[/\\]/).pop();
              if (filename.length > 20)
                filename = filename.substring(0, 18) + "...";

              const barLen = 15;
              const filled = Math.round((barLen * percent) / 100);
              const bar = "█".repeat(filled) + "░".repeat(barLen - filled);

              // Update HTML
              targetElement.innerHTML = `
                        <span class="info">${filename}</span> 
                        <span class="warning">[${bar}] ${percent}%</span> 
                        <span style="color:#888;">| ${received}/${total} @ ${speed}</span>
                      `;
            });
          }, 1000);
        }, 50);
      };

      // --- HELPER: Resolve Targets ---
      const resolveTargets = (inputs, cache, callback) => {
        let targets = [];
        if (inputs.includes("all")) {
          targets = cache.map((item) => item.id);
        } else {
          inputs.forEach((arg) => {
            if (arg.includes("-")) {
              const parts = arg.split("-").map((n) => parseInt(n));
              const start = Math.min(parts[0], parts[1]);
              const end = Math.max(parts[0], parts[1]);
              for (let i = start; i <= end; i++) {
                if (cache[i - 1]) targets.push(cache[i - 1].id);
              }
            } else {
              const parts = arg.split(",").map((n) => parseInt(n));
              parts.forEach((p) => {
                if (!isNaN(p) && cache[p - 1]) targets.push(cache[p - 1].id);
              });
            }
          });
        }
        callback([...new Set(targets)]);
      };

      // ===========================
      // 🚀 ACTION HANDLERS
      // ===========================

      // 1. START DOWNLOAD
      if (action.includes(".") || action.startsWith("http")) {
        const url = action.startsWith("http") ? action : "https://" + action;
        chrome.downloads.download({ url: url }, (id) => {
          if (chrome.runtime.lastError) {
            this.addOutput(
              `Error: ${chrome.runtime.lastError.message}`,
              "error"
            );
          } else {
            monitorDownload(id);
          }
        });
        return;
      }

      // 2. SHOW ACTIVE PROGRESS (NEW FEATURE)
      if (action === "progress") {
        chrome.downloads.search({ state: "in_progress" }, (items) => {
          if (items.length === 0) {
            this.addOutput("No active downloads currently running.", "warning");
            return;
          }
          this.addOutput(
            `Tracking ${items.length} active download(s)...`,
            "success"
          );
          items.forEach((item) => {
            // Har active download ke liye naya monitor attach karein
            monitorDownload(item.id);
          });
        });
        return;
      }

      // 3. LIST ALL
      if (action === "list") {
        chrome.downloads.search(
          { limit: 20, orderBy: ["-startTime"] },
          (items) => {
            this.downloadCache = items;
            if (items.length === 0) {
              this.addOutput("No downloads found.", "warning");
              return;
            }
            this.addOutput("\n⬇️ DOWNLOAD LIST:", "info");
            this.addOutput(
              "SN | STATUS    | PROGRESS      | SIZE      | FILENAME"
            );
            this.addOutput(
              "───┼───────────┼───────────────┼───────────┼────────────────────────"
            );
            items.forEach((item, index) => {
              const sn = (index + 1).toString().padEnd(2);
              let status =
                item.state === "in_progress"
                  ? item.paused
                    ? "Paused"
                    : "Active"
                  : item.state === "interrupted"
                  ? "Failed"
                  : "Done";
              let color =
                status === "Done"
                  ? "success"
                  : status === "Failed"
                  ? "error"
                  : "info";
              const percent =
                item.totalBytes > 0
                  ? Math.round((item.bytesReceived / item.totalBytes) * 100)
                  : 0;
              const bar =
                "█".repeat(Math.round(percent / 10)) +
                "░".repeat(10 - Math.round(percent / 10));
              let name = item.filename.split(/[/\\]/).pop();
              if (name.length > 25) name = name.substring(0, 22) + "...";
              this.addOutput(
                `${sn} | ${status.padEnd(
                  9
                )} | ${bar} ${percent}% | ${formatBytes(item.totalBytes).padEnd(
                  9
                )} | ${name}`,
                color
              );
            });
            this.addOutput(
              "────────────────────────────────────────────────────────────────"
            );
          }
        );
        return;
      }

      // 4. CLEAR LOGS
      if (action === "clear") {
        chrome.downloads.erase({ state: "complete" }, () => {
          this.addOutput("✔ Download log cleaned.", "success");
          this.downloadCache = [];
        });
        return;
      }

      // 5. BULK OPS
      const bulkOps = ["pause", "resume", "cancel", "open", "show"];
      if (bulkOps.includes(action)) {
        const inputs = args.slice(1);
        if (inputs.length === 0) {
          this.addOutput(
            `Usage: download ${action} <id | range | all>`,
            "warning"
          );
          return;
        }
        chrome.downloads.search(
          { limit: 20, orderBy: ["-startTime"] },
          (items) => {
            this.downloadCache = items;
            resolveTargets(inputs, items, (ids) => {
              let count = 0;
              ids.forEach((id) => {
                if (action === "pause") chrome.downloads.pause(id);
                if (action === "resume") chrome.downloads.resume(id);
                if (action === "cancel") chrome.downloads.cancel(id);
                if (action === "show") chrome.downloads.show(id);
                if (action === "open")
                  chrome.downloads
                    .open(id)
                    .catch(() => chrome.downloads.show(id));
                count++;
              });
              this.addOutput(
                `Executed '${action}' on ${count} files.`,
                "success"
              );
            });
          }
        );
        return;
      }

      this.addOutput(
        "Usage: download <url> | progress | list | pause <id>",
        "warning"
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
