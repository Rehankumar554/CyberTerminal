class WidgetManager {
  constructor() {
    this.lastBtcPrice = null;
    this.lastEthPrice = null;
    this.init();
  }

  init() {
    this.initClock();
    this.initWeather();
    this.initQuote();
    this.initCrypto();
    this.initSystemMonitor();
    this.initLogs();

    this.setupCollapsible();
    this.setupDragAndDrop();
    this.loadWidgetState();
  }

  // 1. COLLAPSIBLE SIDEBAR LOGIC
  setupCollapsible() {
    const btn = document.getElementById("widget-toggle-btn");
    const sidebar = document.querySelector(".widgets-section");
    const container = document.querySelector(".container");

    if (!btn || !sidebar) return;

    btn.onclick = () => {
      sidebar.classList.toggle("collapsed");
      container.classList.toggle("sidebar-closed"); // For button rotation

      // Save State
      const settings = JSON.parse(
        localStorage.getItem("terminalSettings") || "{}"
      );
      settings.widgetsCollapsed = sidebar.classList.contains("collapsed");
      localStorage.setItem("terminalSettings", JSON.stringify(settings));
    };
  }

  // 2. DRAG & DROP LOGIC
  setupDragAndDrop() {
    const container = document.querySelector(".widgets-section");
    let draggedItem = null;

    // Har widget ko draggable banao
    const widgets = document.querySelectorAll(".widget");
    widgets.forEach((widget) => {
      widget.setAttribute("draggable", "true");

      // ID check (Persistence ke liye zaroori hai)
      if (!widget.id) {
        // Agar ID nahi hai to class se banao (fallback)
        widget.id = "w_" + widget.className.split(" ")[1];
      }

      widget.addEventListener("dragstart", (e) => {
        draggedItem = widget;
        setTimeout(() => widget.classList.add("dragging"), 0);
      });

      widget.addEventListener("dragend", () => {
        widget.classList.remove("dragging");
        draggedItem = null;

        // Remove visuals
        document
          .querySelectorAll(".widget")
          .forEach((w) => w.classList.remove("drag-over"));

        // Save New Order
        this.saveWidgetOrder();
      });

      // Drag Over Effect
      widget.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (widget !== draggedItem) {
          widget.classList.add("drag-over");
        }
      });

      widget.addEventListener("dragleave", () => {
        widget.classList.remove("drag-over");
      });

      // Drop Logic
      widget.addEventListener("drop", (e) => {
        e.preventDefault();
        widget.classList.remove("drag-over");
        if (draggedItem && draggedItem !== widget) {
          // Logic to swap/insert
          const allWidgets = [...container.querySelectorAll(".widget")];
          const curIndex = allWidgets.indexOf(draggedItem);
          const dropIndex = allWidgets.indexOf(widget);

          if (curIndex < dropIndex) {
            container.insertBefore(draggedItem, widget.nextSibling);
          } else {
            container.insertBefore(draggedItem, widget);
          }
        }
      });
    });
  }

  // 3. PERSISTENCE METHODS (SAVE/LOAD)
  saveWidgetOrder() {
    const container = document.querySelector(".widgets-section");
    const order = [...container.querySelectorAll(".widget")].map((w) => w.id);

    const settings = JSON.parse(
      localStorage.getItem("terminalSettings") || "{}"
    );
    settings.widgetOrder = order;
    localStorage.setItem("terminalSettings", JSON.stringify(settings));
  }

  loadWidgetState() {
    const settings = JSON.parse(
      localStorage.getItem("terminalSettings") || "{}"
    );
    const container = document.querySelector(".widgets-section");
    const mainContainer = document.querySelector(".container");

    // A. Restore Collapsed State
    if (settings.widgetsCollapsed) {
      container.classList.add("collapsed");
      mainContainer.classList.add("sidebar-closed");
    }

    // B. Restore Order
    if (settings.widgetOrder && settings.widgetOrder.length > 0) {
      const currentWidgets = [...container.querySelectorAll(".widget")];
      const widgetMap = {};

      // Map current widgets by ID
      currentWidgets.forEach((w) => {
        // Ensure ID logic matches setupDragAndDrop
        const id = w.id || "w_" + w.className.split(" ")[1];
        w.id = id;
        widgetMap[id] = w;
      });

      // Re-append in saved order
      settings.widgetOrder.forEach((id) => {
        if (widgetMap[id]) {
          container.appendChild(widgetMap[id]);
        }
      });
    }
  }

  initClock() {
    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const dateStr = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      document.getElementById("clock-display").textContent = timeStr;
      document.getElementById("date-display").textContent = dateStr;
    };

    updateClock();
    setInterval(updateClock, 1000);
  }

  initWeather() {
    // OLD: const API_KEY = "hardcoded...";
    // NEW: Use APIManager's config logic or fetch config directly.
    // Behtar hai hum APIManager ke through hi data lein.

    // Refresh weather every 30 minutes
    this.refreshWeatherData();
    setInterval(() => {
      this.refreshWeatherData();
    }, 1800000);
  }

  async refreshWeatherData() {
    document.getElementById("weather-display").innerHTML =
      '<div style="text-align:center;padding:20px;">Getting data...</div>';

    // apiManager se data maange (wo internally config use karega)
    const data = await apiManager.getWeather();

    if (data) {
      const html = `
           <div id="weather-temp">${data.temp}°C</div>
           <div id="weather-desc">${data.description}</div>
           <div id="weather-humidity">Humidity: ${data.humidity}%</div>
           <div id="weather-location">${data.city}, ${data.country}</div>
         `;
      document.getElementById("weather-display").innerHTML = html;
      systemMonitor.addLog(`Weather updated: ${data.city}`);
    } else {
      document.getElementById("weather-display").innerHTML =
        '<div style="text-align:center;color:#ff6600;">Weather Unavailable</div>';
    }
  }

  getGPSLocation(apiKey) {
    document.getElementById("weather-display").innerHTML =
      '<div style="text-align:center;padding:20px;">Getting location...</div>';

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          this.fetchWeatherByCoords(apiKey, lat, lon);
          systemMonitor.addLog(`GPS: ${lat.toFixed(2)}, ${lon.toFixed(2)}`);
        },
        (error) => {
          console.error("GPS error:", error);
          document.getElementById("weather-display").innerHTML =
            '<div style="text-align:center;color:#ff6600;">GPS Denied</div>';
          systemMonitor.addLog("GPS location denied");
          showToast("GPS location denied");
        }
      );
    } else {
      document.getElementById("weather-display").innerHTML =
        '<div style="text-align:center;color:#ff6600;">GPS Not Available</div>';
      systemMonitor.addLog("GPS not supported");
      showToast("GPS not supported");
    }
  }

  fetchWeatherByCoords(apiKey, lat, lon) {
    fetch(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}&aqi=no`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.current) {
          const html = `
            <div id="weather-temp">${Math.round(data.current.temp_c)}°C</div>
            <div id="weather-desc">${data.current.condition.text}</div>
            <div id="weather-humidity">Humidity: ${data.current.humidity}%</div>
            <div id="weather-location">${data.location.name}, ${
            data.location.country
          }</div>
          `;
          document.getElementById("weather-display").innerHTML = html;

          localStorage.setItem("weatherCity", data.location.name);
          localStorage.setItem("weatherLat", lat);
          localStorage.setItem("weatherLon", lon);
          systemMonitor.addLog(`Weather: ${data.location.name}`);
        } else {
          document.getElementById("weather-display").innerHTML =
            '<div style="text-align:center;color:#ff6600;">API Error</div>';
          systemMonitor.addLog(
            `Weather API error: ${data.error?.message || "Unknown"}`
          );
        }
      })
      .catch((err) => {
        console.error("Weather fetch error:", err);
        document.getElementById("weather-display").innerHTML =
          '<div style="text-align:center;color:#ff6600;">Fetch Failed</div>';
        systemMonitor.addLog("Weather fetch failed");
        showToast("Weather fetch failed");
      });
  }

  async initQuote() {
    // Directly ask APIManager (which loads from JSON)
    const quote = await apiManager.getQuote();
    if (quote) {
      const qt = document.getElementById("quote-text");
      const qa = document.getElementById("quote-author");
      if (qt) qt.textContent = `"${quote.content}"`;
      if (qa) qa.textContent = `— ${quote.author}`;
    }
    setInterval(() => this.initQuote(), 3600000);
  }

  // --- REPLACE THIS METHOD IN WidgetManager CLASS ---

  async fetchQuote() {
    try {
      // 1. Fetch from your quote.json
      const response = await fetch("assets/jsons/quote.json");

      if (!response.ok) {
        throw new Error("Failed to load quote.json");
      }

      const quotes = await response.json();

      if (!quotes || quotes.length === 0) {
        throw new Error("Quotes list is empty");
      }

      // 2. Select Random Quote
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

      // 3. Update DOM Elements
      const quoteTextEl = document.getElementById("quote-text");
      const quoteAuthorEl = document.getElementById("quote-author");

      // Note: Aapke JSON me keys "content" aur "author" hain
      if (quoteTextEl) quoteTextEl.textContent = `"${randomQuote.content}"`;
      if (quoteAuthorEl) quoteAuthorEl.textContent = `— ${randomQuote.author}`;

      // Log update (Optional)
      if (typeof systemMonitor !== "undefined") {
        systemMonitor.addLog("Quote updated from file");
      }
    } catch (error) {
      console.error("Widget Quote Error:", error);

      // Fallback UI update
      const quoteTextEl = document.getElementById("quote-text");
      const quoteAuthorEl = document.getElementById("quote-author");

      if (quoteTextEl) quoteTextEl.textContent = `"Keep pushing forward."`;
      if (quoteAuthorEl) quoteAuthorEl.textContent = `— System`;
    }
  }

  initCrypto() {
    this.CRYPTO_INTERVAL_MS = 120000; // 2 Minutes

    const now = Date.now();
    const lastUpdate = parseInt(
      localStorage.getItem("crypto_last_update_ts") || "0"
    );
    const timeSinceLast = now - lastUpdate;
    const timeSinceSec = (timeSinceLast / 1000).toFixed(0);

    // --- 1. INITIAL LOAD CHECK (Refresh Logic) ---
    console.log(`🔍 [Crypto Init] Checking status...`);

    if (lastUpdate > 0 && timeSinceLast < this.CRYPTO_INTERVAL_MS) {
      // 2 Minute nahi hue -> Cache Use karo
      console.log(
        `♻️ [Refresh Detected] Last update was only ${timeSinceSec}s ago (< 120s). Using LocalStorage Cache.`
      );
      this.restoreCachedCrypto();
    } else {
      // Time poora ho gaya ya first load hai -> Fetch karo
      const reason =
        lastUpdate === 0
          ? "First Load"
          : `Time Expired (${timeSinceSec}s > 120s)`;
      console.log(`🚀 [Fresh Load] Fetching new data. Reason: ${reason}`);
      this.fetchCrypto();
    }

    // --- 2. INTERVAL TIMER (Auto-Update Logic) ---
    setInterval(() => {
      if (document.hidden) {
        console.log(
          "💤 [Auto-Update] Interval triggered but Tab is HIDDEN. Skipping API call."
        );
      } else {
        console.log(
          "⏰ [Auto-Update] Interval triggered and Tab is VISIBLE. Fetching data..."
        );
        this.fetchCrypto();
      }
    }, this.CRYPTO_INTERVAL_MS);

    // --- 3. VISIBILITY CHANGE (User Returns Logic) ---
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        // User wapas aaya hai, check karo kitna time hua
        const currentNow = Date.now();
        const currentLastTs = parseInt(
          localStorage.getItem("crypto_last_update_ts") || "0"
        );
        const diff = currentNow - currentLastTs;
        const diffSec = (diff / 1000).toFixed(0);

        if (diff >= this.CRYPTO_INTERVAL_MS) {
          console.log(
            `👋 [User Returned] Stale data detected (Age: ${diffSec}s). Updating immediately...`
          );
          this.fetchCrypto();
        } else {
          console.log(
            `👋 [User Returned] Data is still fresh (Age: ${diffSec}s). No update needed.`
          );
        }
      }
    });
  }

  fetchCrypto() {
    if (typeof apiManager === "undefined") {
      console.warn("❌ [Error] apiManager not found.");
      return;
    }

    console.log("📡 [API] Sending request to fetch crypto prices...");

    // 1. Fetch BTC
    apiManager.getCryptoPrice("BTC").then((price) => {
      if (price) {
        const el = document.getElementById("btc-price");
        if (el) el.textContent = price;
        localStorage.setItem("cached_btc", price);
      }
    });

    // 2. Fetch ETH
    apiManager.getCryptoPrice("ETH").then((price) => {
      if (price) {
        const el = document.getElementById("eth-price");
        if (el) el.textContent = price;
        localStorage.setItem("cached_eth", price);
      }
    });

    // Timestamp save karo
    localStorage.setItem("crypto_last_update_ts", Date.now());

    if (typeof systemMonitor !== "undefined") {
      systemMonitor.addLog("Crypto prices updated");
    }
  }

  restoreCachedCrypto() {
    console.log("💾 [Cache] Restoring prices from LocalStorage...");
    const btc = localStorage.getItem("cached_btc");
    const eth = localStorage.getItem("cached_eth");

    if (btc) {
      const el = document.getElementById("btc-price");
      if (el) el.textContent = btc;
    }

    if (eth) {
      const el = document.getElementById("eth-price");
      if (el) el.textContent = eth;
    }
  }

  // 3. GRAPHICAL SYSTEM MONITOR (Canvas)
  initSystemMonitor() {
    const canvas = document.getElementById("sys-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Canvas sizing setup (to handle blurriness on High DPI screens)
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas(); // Initial call

    const updateCharts = () => {
      // 1. Clear Canvas
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // 2. Draw Sci-Fi Grid (Background)
      ctx.strokeStyle = "rgba(0, 255, 0, 0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Vertical lines
      for (let x = 0; x < w; x += 20) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      // Horizontal lines
      for (let y = 0; y < h; y += 20) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // 3. Helper Function to Draw Line
      const drawLine = (data, color) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";

        // Data plotting logic
        const step = w / (data.length - 1 || 1); // X spacing

        data.forEach((val, index) => {
          const x = index * step;
          const y = h - (val / 100) * h; // 0-100 scale mapping

          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });

        ctx.stroke();

        // Add Glow Effect
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset for next drawing
      };

      // 4. Fetch Data from System.js
      const cpuData = systemMonitor.cpuHistory; // Array [10, 20, 15...]
      const ramData = systemMonitor.ramHistory;

      // 5. Draw Lines (RAM first so CPU is on top)
      if (ramData.length) drawLine(ramData, "#00d9ff"); // Blue for RAM
      if (cpuData.length) drawLine(cpuData, "#00ff00"); // Green for CPU

      // 6. Update Text Values
      const lastCpu = cpuData[cpuData.length - 1] || 0;
      const lastRam = ramData[ramData.length - 1] || 0;

      const cpuEl = document.getElementById("cpu-val");
      const ramEl = document.getElementById("ram-val");
      const upEl = document.getElementById("uptime-display");

      if (cpuEl) cpuEl.textContent = Math.round(lastCpu) + "%";
      if (ramEl) ramEl.textContent = Math.round(lastRam) + "%";
      if (upEl) upEl.textContent = systemMonitor.getUptime();
    };

    // Update Animation Loop (1 FPS is enough as data updates every 2s)
    setInterval(updateCharts, 1000);

    // Initial draw
    updateCharts();
  }
  initLogs() {
    const logsDisplay = document.getElementById("logs-display");

    setInterval(() => {
      const logs = systemMonitor.getLogs().slice(-10);
      logsDisplay.innerHTML = logs
        .map((log) => `<div class="log-entry">${log}</div>`)
        .join("");
    }, 5000);
  }
}

// Initialize widgets on page load
window.addEventListener("DOMContentLoaded", () => {
  new WidgetManager();
});
