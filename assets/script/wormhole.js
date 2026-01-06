class WormholeManager {
  constructor(terminalInstance) {
    this.term = terminalInstance;

    // Configuration
    this.DB_URL = "https://rks-dev-22651-default-rtdb.firebaseio.com/";
    this.CLIENT_URL = "https://cybertermchatsystem.netlify.app/";

    // State
    this.active = false;
    this.roomId = null;
    this.key = null;
    this.passkey = null; // NEW: 6-char passkey
    this.titlepasskey = null;
    this.pollInterval = null;
    this.knownMsgIds = new Set();
    // this.pendingHandshake = null;
    this.winManager = null;
    this.currentFullLink = null;
    this.isTerminating = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.lastPollTime = 0;
    this.sessionStartTime = 0;

    // Cleanup tracking
    this.eventListeners = [];
  }

  init() {
    // Map Elements
    this.els = {
      modal: document.getElementById("wh-window"),
      scan: document.getElementById("wh-screen-scan"),
      warn: document.getElementById("wh-screen-warning"),
      chat: document.getElementById("wh-screen-chat"),
      qr: document.getElementById("wh-qr-target"),
      link: document.getElementById("wh-link-text"),
      passkey: document.getElementById("wh-passkey-display"), // NEW
      titlepasskey: document.getElementById("wh-title-passkey"),
      feedback: document.getElementById("wh-copy-feedback"),
      history: document.getElementById("wh-chat-history"),
      input: document.getElementById("wh-input-field"),
      maxBtn: document.getElementById("wh-btn-maximize"),
      minBtn: document.getElementById("wh-btn-minimize"),
    };

    // Validate all required elements exist
    for (const [key, el] of Object.entries(this.els)) {
      if (!el) {
        console.error(`Wormhole: Missing element ${key}`);
        return false;
      }
    }

    // Initialize Window Manager
    this.winManager = new WindowManager("wh-window", "wh-header", "wh-body");

    // Setup Event Listeners with cleanup tracking
    this.setupEventListeners();

    // Auto-cleanup on page unload
    this.addListener(window, "beforeunload", () => this.cleanup());
    this.addListener(window, "pagehide", () => this.cleanup());

    return true;
  }

  setupEventListeners() {
    // Close Button
    this.addListener(document.getElementById("wh-btn-close"), "click", () =>
      this.endSession("manual")
    );

    // Minimize Button (_)
    // --- SMART WINDOW CONTROLS ---

    // 1. Minimize Button Logic (_)
    if (this.els.minBtn) {
      this.addListener(this.els.minBtn, "click", (e) => {
        e.stopPropagation();

        // Check: Kya abhi Fullscreen (Maximized) hai?
        if (this.els.modal.classList.contains("wh-maximized")) {
          // CASE A: Fullscreen -> Default
          // Agar Maximize hai, to Minimize button dabane par Normal karo (Bubble mat banao)
          this.toggleMaximize();
        } else {
          // CASE B: Default -> Bubble
          // Agar Normal hai, to Minimize button dabane par Bubble bana do
          this.toggleMinimize(true);
        }
      });
    }

    // 2. Maximize Button Logic (□)
    if (this.els.maxBtn) {
      this.addListener(this.els.maxBtn, "click", (e) => {
        e.stopPropagation();
        // Toggle: Default <-> Fullscreen
        this.toggleMaximize();
      });
    }

    // Handshake Buttons
    this.addListener(document.getElementById("wh-btn-deny"), "click", () =>
      this.endSession("manual")
    );
    this.addListener(document.getElementById("wh-btn-accept"), "click", () =>
      this.acceptConnection()
    );

    // Chat Send
    const sendBtn = document.getElementById("wh-btn-send");
    const handleSend = () => {
      const text = this.els.input.value.trim();
      if (text && text.length <= 1000) {
        this.sendMessage(text);
        this.els.input.value = "";
      }
    };

    this.addListener(sendBtn, "click", handleSend);
    this.addListener(this.els.input, "keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // Copy Link Handler
    this.addListener(this.els.link, "click", () => {
      if (this.currentFullLink) {
        navigator.clipboard
          .writeText(this.currentFullLink)
          .then(() => {
            this.els.feedback.style.opacity = "1";
            setTimeout(() => (this.els.feedback.style.opacity = "0"), 2000);
          })
          .catch((err) => console.error("Copy failed:", err));
      }
    });

    // NEW: Copy Passkey Handler
    this.addListener(this.els.passkey, "click", () => {
      if (this.passkey) {
        navigator.clipboard
          .writeText(this.passkey)
          .then(() => {
            const original = this.els.passkey.textContent;
            this.els.passkey.textContent = "✓ COPIED!";
            setTimeout(() => {
              this.els.passkey.textContent = original;
            }, 1500);
          })
          .catch((err) => console.error("Copy failed:", err));
      }
    });
  }

  // Helper to track event listeners for cleanup
  addListener(element, event, handler) {
    if (!element) return;
    element.addEventListener(event, handler);
    this.eventListeners.push({ element, event, handler });
  }

  // Clean up all event listeners
  removeAllListeners() {
    this.eventListeners.forEach(({ element, event, handler }) => {
      if (element) {
        element.removeEventListener(event, handler);
      }
    });
    this.eventListeners = [];
  }

  async start() {
    if (this.active) {
      this.term.addOutput("[WORMHOLE] Session already active", "warning");
      return;
    }

    // Reset state
    this.isTerminating = false;
    this.retryCount = 0;
    this.knownMsgIds.clear();
    // this.pendingHandshake = null;

    // Reset UI
    this.els.qr.innerHTML = "";
    this.els.link.textContent = "Generating Link...";
    this.els.passkey.textContent = "------"; // NEW
    this.els.history.innerHTML = "";
    this.els.feedback.style.opacity = "0";

    // Show Scan Screen
    this.els.modal.style.display = "flex";
    this.els.scan.style.display = "flex";
    this.els.warn.style.display = "none";
    this.els.chat.style.display = "none";

    if (this.winManager) this.winManager.reset();

    // Generate Credentials
    this.roomId = "term_" + this.generateSecureId(12);
    this.key = this.generateSecureKey();
    this.passkey = this.generatePasskey(); // NEW: 6-char passkey
    this.active = true;
    this.sessionStartTime = Date.now();

    // Create Session Metadata with Passkey
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const slowWarn = setTimeout(() => {
        // Agar showToast global function hai to use karein, nahi to console/terminal log
        if (typeof showToast === "function") {
          showToast("Connection taking longer than usual... (Wait 15s)");
        } else {
          this.term.addOutput(
            "[NETWORK] Connection slow... waiting 15s",
            "warning"
          );
        }
      }, 5000);

      const metaRes = await fetch(
        `${this.DB_URL}CyberTermChat/${this.roomId}/meta.json`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            created: this.sessionStartTime,
            version: "1.0",
            passkey: this.passkey, // NEW: Store passkey
            encryptionKey: this.key,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);
      clearTimeout(slowWarn);

      if (!metaRes.ok) {
        throw new Error("Failed to create session");
      }

      // NEW: Register passkey in global lookup
      await this.registerPasskey();
    } catch (e) {
      console.error("Firebase Init Error:", e);
      this.term.addOutput("[WORMHOLE] Failed to create session", "error");
      this.active = false;
      this.els.modal.style.display = "none";
      return;
    }

    // Generate Full Link
    this.currentFullLink = `${this.CLIENT_URL}?room=${
      this.roomId
    }&db=${encodeURIComponent(this.DB_URL)}#${this.key}`;

    this.els.qr.style.backgroundColor = "#ffffff";
    this.els.qr.style.padding = "15px";
    this.els.qr.style.borderRadius = "4px";
    this.els.qr.style.display = "inline-block";

    new QRCode(this.els.qr, {
      text: this.currentFullLink,
      width: 180, // Size adjust kiya padding ke hisab se
      height: 180,
      colorDark: "#000000",
      colorLight: "#ffffff", // Ye QR ke andar ka background white rakhta hai
      correctLevel: QRCode.CorrectLevel.L, // Low complexity = Better scanning
    });

    // 3. Image Alignment Fix
    setTimeout(() => {
      const img = this.els.qr.querySelector("img");
      if (img) {
        img.style.display = "block";
      }
    }, 50);

    // Update UI Text
    this.els.link.textContent = this.currentFullLink;
    this.els.passkey.textContent = this.passkey; // NEW: Display passkey
    this.els.titlepasskey.textContent = `(${this.passkey})`;

    // Start Polling
    this.startPolling();
    this.term.addOutput(
      `[WORMHOLE] Session created | Passkey: ${this.passkey}`,
      "success"
    );
  }

  // NEW: Generate 6-character passkey
  generatePasskey() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous: 0,O,1,I
    const random = new Uint8Array(6);
    crypto.getRandomValues(random);
    return Array.from(random)
      .map((byte) => chars[byte % chars.length])
      .join("");
  }

  // NEW: Register passkey in global lookup table
  async registerPasskey() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const slowWarn = setTimeout(() => {
        if (typeof showToast === "function") {
          showToast("Registering passkey is taking time...");
        }
      }, 5000);

      await fetch(`${this.DB_URL}PasskeyLookup/${this.passkey}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: this.roomId,
          created: this.sessionStartTime,
          expires: this.sessionStartTime + 30 * 60 * 1000, // 30 min
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      clearTimeout(slowWarn);
    } catch (e) {
      console.error("Passkey registration failed:", e);
      this.term.addOutput(
        "[WARNING] Passkey registration timed out",
        "warning"
      );
    }
  }

  // NEW: Cleanup passkey on session end
  async deletePasskey() {
    if (!this.passkey) return;

    try {
      await fetch(`${this.DB_URL}PasskeyLookup/${this.passkey}.json`, {
        method: "DELETE",
        keepalive: true,
      });
    } catch (e) {
      console.error("Passkey delete error:", e);
    }
  }

  generateSecureId(length = 12) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    const random = new Uint8Array(length);
    crypto.getRandomValues(random);
    return Array.from(random)
      .map((byte) => chars[byte % chars.length])
      .join("");
  }

  generateSecureKey() {
    const bytes = new Uint8Array(32); // 256-bit key
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);

    this.pollInterval = setInterval(async () => {
      if (!this.active || this.isTerminating) return;

      // Session timeout check (30 minutes)
      const sessionAge = Date.now() - this.sessionStartTime;
      if (sessionAge > 30 * 60 * 1000) {
        this.addLog("Session timeout reached", "error");
        this.endSession("timeout");
        return;
      }

      await this.poll();
    }, 2000);
  }

  async poll() {
    if (!this.active || this.isTerminating) return;

    const url = `${this.DB_URL}CyberTermChat/${this.roomId}/messages.json`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        if (this.isTerminating) return;
        if (res.status === 404) {
          this.checkStatus();
          return;
        } else if (res.status === 401 || res.status === 403) {
          this.addLog("Permission denied - session invalid", "error");
          this.endSession("error");
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data === null) {
        if (this.els.scan.style.display === "none") {
          this.checkStatus();
        }
        return;
      }

      if (data && typeof data === "object") {
        const entries = Object.entries(data);

        for (const [id, msg] of entries) {
          if (!this.knownMsgIds.has(id) && msg && msg.payload) {
            this.knownMsgIds.add(id);
            await this.processMsg(msg);
          }
        }
      }

      this.retryCount = 0;
      this.lastPollTime = Date.now();
    } catch (e) {
      if (e.name === "AbortError") {
        console.warn("Poll timeout");
      } else {
        console.error("Poll error:", e);
      }

      this.retryCount++;
      if (this.retryCount >= this.maxRetries) {
        this.addLog("Connection lost - too many retries", "error");
        this.endSession("error");
      }
    }
  }

  async checkStatus() {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(
        `${this.DB_URL}CyberTermChat/${this.roomId}.json`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      const data = await res.json();

      if (!data || data === null) {
        this.addLog("Session terminated by remote", "error");
        setTimeout(() => this.endSession("remote"), 1000);
      }
    } catch (e) {
      console.error("Status check error:", e);
    }
  }

  // --- NEW: Helper to generate color from name ---
  getColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  }

  async processMsg(msgObj) {
    try {
      if (!msgObj || !msgObj.payload) {
        throw new Error("Invalid message structure");
      }

      const json = await this.decrypt(msgObj.payload);
      const data = JSON.parse(json);

      if (!data || typeof data.text !== "string" || !data.sender) {
        throw new Error("Invalid message format");
      }

      if (data.sender === "terminal") return;

      const lowerText = data.text.toLowerCase().trim();

      if (["abort", "disconnect"].includes(lowerText)) {
        this.addLog("Remote peer disconnected", "error");

        // --- FIX: Stop polling immediately ---
        if (this.pollInterval) clearInterval(this.pollInterval);
        // -------------------------------------

        setTimeout(() => this.endSession("remote"), 1000);
        return;
      }

      if (this.els.scan.style.display !== "none") {
        this.els.scan.style.display = "none";
        this.els.warn.style.display = "flex";
        this.beep("alert");
        // this.pendingHandshake = data.text;
        return;
      }

      this.addLog(data.text, "received", data.sender);
      this.beep("key");
    } catch (e) {
      console.error("Message process error:", e);
    }
  }

  async sendMessage(text) {
    if (!this.active || this.isTerminating || !text) return;

    text = text.trim().substring(0, 1000);

    this.addLog(text, "sent");

    try {
      const payload = JSON.stringify({
        sender: "terminal",
        text: text,
        timestamp: Date.now(),
      });
      const encrypted = await this.encrypt(payload);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(
        `${this.DB_URL}CyberTermChat/${this.roomId}/messages.json`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payload: encrypted,
            timestamp: Date.now(),
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error("Send failed");
      }

      const lowerText = text.toLowerCase().trim();
      if (["abort", "disconnect"].includes(lowerText)) {
        this.addLog("Disconnecting...", "error");

        // --- FIX: Stop polling immediately ---
        if (this.pollInterval) clearInterval(this.pollInterval);
        // -------------------------------------

        setTimeout(() => this.endSession("manual"), 1000);
      }
    } catch (e) {
      console.error("Send error:", e);
      this.addLog("⚠️ Message send failed", "error");
    }
  }

  acceptConnection() {
    // 1. UI Switch
    this.els.warn.style.display = "none";
    this.els.chat.style.display = "flex";
    this.els.history.innerHTML = `<div class="chat-msg system">🔥 Secured by Google Firebase</div>`;

    // 2. Reset Logic (CRITICAL FIXES)

    // Fix A: Reset Time taaki DB se saare messages wapas fetch hon
    this.lastTime = 0;

    // Fix B: Clear Memory taaki script in messages ko "Naya" samjhe
    // Agar ye nahi karenge to script sochegi ye pehle hi aa chuke hain
    this.knownMsgIds.clear();

    // 3. Restart Polling
    this.startPolling();

    // 4. Focus Input
    if (this.els.input) {
      this.els.input.focus();
    }
  }

  // --- BUBBLE MODE (Gola) ---
  toggleMinimize(minimize) {
    if (!this.els.modal) return;

    if (minimize) {
      // Default -> Bubble
      this.els.modal.classList.add("wh-minimized");
      this.els.modal.classList.remove("wh-maximized"); // Safety: Maximize hata do

      // Click to Restore Logic
      this.restoreHandler = () => this.toggleMinimize(false);
      this.els.modal.addEventListener("click", this.restoreHandler, {
        once: true,
      });
    } else {
      // Bubble -> Default
      this.els.modal.classList.remove("wh-minimized");

      if (this.restoreHandler) {
        this.els.modal.removeEventListener("click", this.restoreHandler);
        this.restoreHandler = null;
      }
    }
  }

  // --- FULLSCREEN MODE (100%) ---
  toggleMaximize() {
    if (!this.els.modal) return;

    // Toggle Maximize Class
    const isMax = this.els.modal.classList.toggle("wh-maximized");

    // Agar Maximize hua hai, to Bubble mode hata do (Safety)
    if (isMax) {
      this.els.modal.classList.remove("wh-minimized");
    }
  }

  async endSession(reason) {
    if (this.isTerminating) return;
    this.isTerminating = true;
    this.active = false;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.els.modal) {
      this.els.modal.style.display = "none";
    }

    // Delete session and passkey
    if (this.roomId && reason === "manual") {
      await this.deleteSession();
      await this.deletePasskey(); // NEW: Delete passkey
    }

    const messages = {
      manual: "Session closed by user",
      remote: "Session terminated by remote",
      timeout: "Session timeout",
      error: "Session error - connection lost",
    };

    const msg = messages[reason] || "Session ended";
    this.term.addOutput(`[WORMHOLE] ${msg}`, "warning");

    // Reset state
    this.roomId = null;
    this.key = null;
    this.passkey = null; // NEW
    this.currentFullLink = null;
    this.knownMsgIds.clear();
    this.retryCount = 0;

    if (this.els.qr) this.els.qr.innerHTML = "";
    if (this.els.history) this.els.history.innerHTML = "";
    if (this.els.passkey) this.els.passkey.textContent = "------"; // NEW
  }

  async deleteSession() {
    if (!this.roomId) return;

    try {
      const url = `${this.DB_URL}CyberTermChat/${this.roomId}.json`;
      await fetch(url, {
        method: "DELETE",
        keepalive: true,
      });
    } catch (e) {
      console.error("Delete session error:", e);
    }
  }

  cleanup() {
    if (this.active && this.roomId) {
      this.deleteSession();
      this.deletePasskey(); // NEW
    }
    this.removeAllListeners();
  }

  addLog(text, type, senderName = null) {
    if (!this.els.history) return;

    // --- 1. HANDLE SYSTEM & ERROR MESSAGES (Single Div, No Span) ---
    const isSystem =
      text.endsWith(" connected") || text.endsWith(" disconnected");
    const isError = type === "error";

    if (isSystem || isError) {
      const div = document.createElement("div");
      // Class: "chat-msg system" ya "chat-msg error"
      div.className = isError ? "chat-msg error" : "chat-msg system";
      div.textContent = text; // Direct text

      this.els.history.appendChild(div);
      this.els.history.scrollTop = this.els.history.scrollHeight;
      return;
    }
    // ---------------------------------------------------------------

    // --- 2. NORMAL CHAT MESSAGES ---
    const cssType = type === "received" ? "rec" : type;

    const row = document.createElement("div");
    row.className = `msg-row ${cssType}`;

    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const iconType = cssType === "sent" ? "dns" : "person";
    const iconHtml = `<span class="material-icons" style="font-size:10px; vertical-align:middle;">${iconType}</span>`;

    let labelHtml = "";
    let bubbleStyle = "";
    let timeStyle = "";

    if (cssType === "rec" && senderName) {
      const color = this.getColor(senderName);
      labelHtml = `<div class="sender-label" style="color: ${color};">${senderName}</div>`;
      bubbleStyle = `border-left-color: ${color}; border-top-color: ${color}44;`;
      timeStyle = `color: ${color};`;
    }

    const safe = document.createElement("div");
    safe.textContent = text;

    row.innerHTML = `
      ${labelHtml}
      <div class="bubble" style="${bubbleStyle}">
        ${safe.innerHTML}
      </div>
      <div class="timestamp" style="${timeStyle}">
        ${iconHtml} ${time}
      </div>
    `;

    this.els.history.appendChild(row);
    this.els.history.scrollTop = this.els.history.scrollHeight;
  }

  beep(type) {
    if (this.term && typeof this.term.playKeySound === "function") {
      this.term.playKeySound(type);
    }
  }

  // Crypto Engine
  async getKey(k) {
    try {
      const e = new TextEncoder();
      const d = await crypto.subtle.digest("SHA-256", e.encode(k));
      return crypto.subtle.importKey("raw", d, { name: "AES-GCM" }, false, [
        "encrypt",
        "decrypt",
      ]);
    } catch (e) {
      throw new Error("Key generation failed");
    }
  }

  async encrypt(t) {
    try {
      const k = await this.getKey(this.key);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const e = new TextEncoder();
      const c = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        k,
        e.encode(t)
      );
      return btoa(
        String.fromCharCode(
          ...Array.from(iv).concat(Array.from(new Uint8Array(c)))
        )
      );
    } catch (e) {
      throw new Error("Encryption failed");
    }
  }

  async decrypt(d) {
    try {
      const r = atob(d);
      const a = new Uint8Array(r.length);

      for (let i = 0; i < r.length; i++) {
        a[i] = r.charCodeAt(i);
      }

      if (a.length < 12) {
        throw new Error("Invalid encrypted data");
      }

      const iv = a.slice(0, 12);
      const c = a.slice(12);
      const k = await this.getKey(this.key);
      const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, k, c);

      return new TextDecoder().decode(dec);
    } catch (e) {
      throw new Error("Decryption failed");
    }
  }
}
