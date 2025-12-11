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
    // Hardcoded API key - replace with your own WeatherAPI key
    const API_KEY = "YOUR_ACTUAL_API_KEY_HERE";

    // Automatically get GPS location on load
    this.getGPSLocation(API_KEY);

    // Refresh weather every 30 minutes
    setInterval(() => {
      this.getGPSLocation(API_KEY);
    }, 1800000);
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

  initQuote() {
    this.fetchQuote();
    // Refresh quote every hour
    setInterval(() => this.fetchQuote(), 3600000);
  }

  fetchQuote() {
    const quotes = [
      {
        content: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
      },
      {
        content: "Innovation distinguishes between a leader and a follower.",
        author: "Steve Jobs",
      },
      {
        content: "Code is like humor. When you have to explain it, it's bad.",
        author: "Cory House",
      },
      {
        content: "First, solve the problem. Then, write the code.",
        author: "John Johnson",
      },
      {
        content: "Experience is the name everyone gives to their mistakes.",
        author: "Oscar Wilde",
      },
      {
        content: "In order to be irreplaceable, one must always be different.",
        author: "Coco Chanel",
      },
      {
        content: "Java is to JavaScript what car is to Carpet.",
        author: "Chris Heilmann",
      },
      { content: "Knowledge is power.", author: "Francis Bacon" },
      {
        content:
          "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday's code.",
        author: "Dan Salomon",
      },
      {
        content:
          "Perfection is achieved not when there is nothing more to add, but rather when there is nothing more to take away.",
        author: "Antoine de Saint-Exupery",
      },
      {
        content: "Ruby is rubbish! PHP is phpantastic!",
        author: "Nikita Popov",
      },
      {
        content: "Code never lies, comments sometimes do.",
        author: "Ron Jeffries",
      },
      {
        content: "Simplicity is the soul of efficiency.",
        author: "Austin Freeman",
      },
      {
        content: "Before software can be reusable it first has to be usable.",
        author: "Ralph Johnson",
      },
      {
        content: "Make it work, make it right, make it fast.",
        author: "Kent Beck",
      },
    ];

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    document.getElementById(
      "quote-text"
    ).textContent = `"${randomQuote.content}"`;
    document.getElementById(
      "quote-author"
    ).textContent = `— ${randomQuote.author}`;
    systemMonitor.addLog("Quote updated");
  }

  initCrypto() {
    this.fetchCrypto();
    // Refresh crypto prices every 2 minutes
    setInterval(() => this.fetchCrypto(), 120000);
  }

  fetchCrypto() {
    // Simulated crypto prices that update with realistic variations
    const updatePrice = (basePrice, lastPrice) => {
      if (!lastPrice) return basePrice;
      const change = (Math.random() - 0.5) * basePrice * 0.02; // 2% max change
      return Math.max(
        basePrice * 0.8,
        Math.min(basePrice * 1.2, lastPrice + change)
      );
    };

    if (!this.lastBtcPrice) this.lastBtcPrice = 43250;
    if (!this.lastEthPrice) this.lastEthPrice = 2280;

    this.lastBtcPrice = updatePrice(43250, this.lastBtcPrice);
    this.lastEthPrice = updatePrice(2280, this.lastEthPrice);

    document.getElementById("btc-price").textContent = `${Math.round(
      this.lastBtcPrice
    ).toLocaleString()}`;
    document.getElementById("eth-price").textContent = `${Math.round(
      this.lastEthPrice
    ).toLocaleString()}`;
    systemMonitor.addLog("Crypto prices updated");
  }

  initSystemMonitor() {
    const updateStats = () => {
      const cpu = systemMonitor.getCpuUsage();
      const ram = systemMonitor.getRamUsage();
      const uptime = systemMonitor.getUptime();

      document.getElementById("cpu-usage").textContent = `${cpu}%`;
      document.getElementById("cpu-bar").style.width = `${cpu}%`;

      document.getElementById("ram-usage").textContent = `${ram}%`;
      document.getElementById("ram-bar").style.width = `${ram}%`;

      document.getElementById("uptime-display").textContent = uptime;
    };

    updateStats();
    setInterval(updateStats, 2000);
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
