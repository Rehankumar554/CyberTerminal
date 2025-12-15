class WormholeManager {
  constructor(terminalInstance) {
    this.term = terminalInstance;

    // ðŸ‘‡ CONFIGURATION (DO NOT CHANGE PATHS)
    this.DB_URL = "https://rks-dev-22651-default-rtdb.firebaseio.com/";
    this.CLIENT_URL = "https://cybertermchatsystem.netlify.app/";

    // State
    this.active = false;
    this.roomId = null;
    this.key = null;
    this.pollInterval = null;
    this.knownMsgIds = new Set();
    this.pendingHandshake = null;
    this.winManager = null;
  }

  init() {
    // 1. Map New Elements (Unique wh- IDs)
    this.els = {
      modal: document.getElementById("wh-window"),
      scan: document.getElementById("wh-screen-scan"),
      warn: document.getElementById("wh-screen-warning"),
      chat: document.getElementById("wh-screen-chat"),
      qr: document.getElementById("wh-qr-target"),
      link: document.getElementById("wh-link-text"), // <-- Link Span
      feedback: document.getElementById("wh-copy-feedback"),
      history: document.getElementById("wh-chat-history"),
      input: document.getElementById("wh-input-field"),
    };

    // 2. Initialize Window Manager
    // (Modal ID, Header ID, Content ID)
    this.winManager = new WindowManager("wh-window", "wh-header", "wh-body");

    // 3. Event Listeners
    // Close & Minimize
    document
      .getElementById("wh-btn-close")
      .addEventListener("click", () => this.endSession("manual"));

    const minBtn = document.getElementById("wh-btn-minimize");
    if (minBtn)
      minBtn.addEventListener("click", () => this.winManager.toggleMinimize());

    // Handshake Buttons
    document
      .getElementById("wh-btn-deny")
      .addEventListener("click", () => this.endSession("manual"));
    document
      .getElementById("wh-btn-accept")
      .addEventListener("click", () => this.acceptConnection());

    // Chat Send
    const sendBtn = document.getElementById("wh-btn-send");
    const handleSend = () => {
      const text = this.els.input.value.trim();
      if (text) {
        this.sendMessage(text);
        this.els.input.value = "";
      }
    };

    sendBtn.addEventListener("click", handleSend);
    this.els.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleSend();
    });

    this.els.link.addEventListener("click", () => {
      if (this.currentFullLink) {
        navigator.clipboard.writeText(this.currentFullLink);
        // Show Feedback
        this.els.feedback.style.opacity = "1";
        setTimeout(() => (this.els.feedback.style.opacity = "0"), 2000);
      }
    });

    // ðŸ‘‡ NEW FIX: Auto-Delete on Refresh/Tab Close
    window.addEventListener("beforeunload", () => {
      if (this.active && this.roomId) {
        // 'keepalive: true' allows request to complete even after page dies
        fetch(`${this.DB_URL}CyberTermChat/${this.roomId}.json`, {
          method: "DELETE",
          keepalive: true,
        });
      }
    });
  }

  async start() {
    // 1. Reset UI Immediately
    this.els.qr.innerHTML = "";
    this.els.link.textContent = "Generating Link..."; // Placeholder text
    this.els.history.innerHTML = "";
    this.els.feedback.style.opacity = "0";

    // Show Scan Screen
    this.els.modal.style.display = "flex";
    this.els.scan.style.display = "flex";
    this.els.warn.style.display = "none";
    this.els.chat.style.display = "none";

    // Ensure not minimized
    if (this.winManager) this.winManager.reset();

    // 2. Generate Credentials
    this.roomId = "term_" + Math.random().toString(36).substr(2, 9);
    this.key = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    this.active = true;
    this.knownMsgIds.clear();
    this.pendingHandshake = null;

    // Create Meta
    try {
      await fetch(`${this.DB_URL}CyberTermChat/${this.roomId}/meta.json`, {
        method: "PUT",
        body: JSON.stringify({ created: Date.now() }),
      });
    } catch (e) {
      console.error("Firebase Init Error", e);
    }

    // 3. Generate Link & SAVE IT TO CLASS PROPERTY
    this.currentFullLink = `${this.CLIENT_URL}?room=${
      this.roomId
    }&db=${encodeURIComponent(this.DB_URL)}#${this.key}`;

    // 4. Render QR
    this.els.qr.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      this.currentFullLink
    )}" class="qr-image" style="display:block; width:100%; height:auto;">`;

    // 5. UPDATE UI TEXT (Ye line missing thi)
    this.els.link.textContent = this.currentFullLink;

    // Start Polling
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => this.poll(), 2000);
  }

  async poll() {
    if (!this.active) return;
    const url = `${this.DB_URL}CyberTermChat/${this.roomId}/messages.json`;

    try {
      const res = await fetch(url);
      // If room deleted (404 or null), check status
      if (!res.ok) {
        this.checkStatus();
        return;
      }

      const data = await res.json();
      if (data) {
        Object.entries(data).forEach(([id, msg]) => {
          if (!this.knownMsgIds.has(id)) {
            this.knownMsgIds.add(id);
            this.processMsg(msg);
          }
        });
      } else if (this.els.scan.style.display === "none") {
        // Chat active but no data? check if session killed
        this.checkStatus();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async checkStatus() {
    try {
      const res = await fetch(
        `${this.DB_URL}CyberTermChat/${this.roomId}.json`
      );
      const data = await res.json();
      if (!data) {
        this.addLog("Session terminated by remote.", "error");
        setTimeout(() => this.endSession("remote"), 1500);
      }
    } catch (e) {}
  }

  async processMsg(msgObj) {
    try {
      const json = await this.decrypt(msgObj.payload);
      const data = JSON.parse(json);

      if (data.sender === "terminal") return;

      // Disconnect Command
      if (["abort", "disconnect"].includes(data.text.toLowerCase())) {
        this.addLog("Remote peer disconnected.", "error");
        setTimeout(() => this.endSession("remote"), 1000);
        return;
      }

      // Handshake Logic
      if (this.els.scan.style.display !== "none") {
        this.els.scan.style.display = "none";
        this.els.warn.style.display = "flex";
        this.beep("alert");
        this.pendingHandshake = data.text;
        return;
      }

      this.addLog(data.text, "received");
      this.beep("key");
    } catch (e) {
      console.error("Decrypt Error", e);
    }
  }

  async sendMessage(text) {
    if (!this.active) return;
    this.addLog(text, "sent");

    const payload = JSON.stringify({ sender: "terminal", text: text });
    const encrypted = await this.encrypt(payload);

    await fetch(`${this.DB_URL}CyberTermChat/${this.roomId}/messages.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: encrypted, timestamp: Date.now() }),
    });

    if (["abort", "disconnect"].includes(text.toLowerCase())) {
      this.addLog("Disconnecting...", "error");
      setTimeout(() => this.endSession("manual"), 1000);
    }
  }

  acceptConnection() {
    this.els.warn.style.display = "none";
    this.els.chat.style.display = "flex";
    this.els.history.innerHTML = `<div class="chat-msg system">🔥 Secured by Google Firebase</div>`;

    if (this.pendingHandshake) {
      this.addLog(this.pendingHandshake, "received");
      this.pendingHandshake = null;
    }
    this.els.input.focus();
  }

  async endSession(reason) {
    this.active = false;
    this.els.modal.style.display = "none";

    if (this.pollInterval) clearInterval(this.pollInterval);

    // Delete Data if Manual
    if (this.roomId && reason === "manual") {
      const url = `${this.DB_URL}CyberTermChat/${this.roomId}.json`;
      try {
        await fetch(url, { method: "DELETE" });
      } catch (e) {}
    }

    const msg = reason === "manual" ? "Session closed." : "Remote terminated.";
    this.term.addOutput(`[WORMHOLE] ${msg}`, "warning");

    this.roomId = null;
    this.key = null;
    this.currentFullLink = null;
    this.els.qr.innerHTML = "";
  }

  addLog(text, type) {
    const div = document.createElement("div");
    div.className = `chat-msg ${type}`;
    div.innerHTML = `<div class="msg-content">${text}</div><div class="msg-time">${new Date().toLocaleTimeString()}</div>`;
    this.els.history.appendChild(div);
    this.els.history.scrollTop = this.els.history.scrollHeight;
  }

  beep(type) {
    if (this.term && this.term.playKeySound) this.term.playKeySound(type);
  }

  // Crypto Engine
  async getKey(k) {
    const e = new TextEncoder(),
      d = await crypto.subtle.digest("SHA-256", e.encode(k));
    return crypto.subtle.importKey("raw", d, { name: "AES-GCM" }, !1, [
      "encrypt",
      "decrypt",
    ]);
  }
  async encrypt(t) {
    const k = await this.getKey(this.key),
      iv = crypto.getRandomValues(new Uint8Array(12)),
      e = new TextEncoder(),
      c = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, e.encode(t));
    return btoa(
      String.fromCharCode(
        ...Array.from(iv).concat(Array.from(new Uint8Array(c)))
      )
    );
  }
  async decrypt(d) {
    const r = atob(d),
      a = new Uint8Array(r.length);
    for (let i = 0; i < r.length; i++) a[i] = r.charCodeAt(i);
    const iv = a.slice(0, 12),
      c = a.slice(12),
      k = await this.getKey(this.key),
      dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, k, c);
    return new TextDecoder().decode(dec);
  }
}
