class APIManager {
  constructor() {
    this.config = null;
    this.mockData = null;
    // Initialization process ko ek Promise mein store karein
    this.initPromise = this.init();
  }

  async init() {
    try {
      // Load Config & Mock Data parallelly
      const [configRes, mockRes] = await Promise.all([
        fetch("assets/jsons/config.json"),
        fetch("assets/jsons/mock_data.json"),
      ]);

      if (configRes.ok) this.config = await configRes.json();
      if (mockRes.ok) this.mockData = await mockRes.json();
    } catch (e) {
      console.error("API Manager Init Error:", e);
    }
  }

  // Helper to ensure config is loaded before making calls
  async waitForConfig() {
    // Agar config pehle se loaded hai to return karein
    if (this.config) return;

    // Agar load nahi hua hai, to init process ke khatam hone ka wait karein
    await this.initPromise;

    // Safety check: Agar wait karne ke baad bhi config null hai (e.g., fetch error)
    if (!this.config) {
      console.warn("Warning: Config could not be loaded.");
    }
  }

  async getWeather() {
    await this.waitForConfig();
    try {
      return await this.getWeatherByGPS();
    } catch (error) {
      console.error("Weather API error:", error);
      if (typeof systemMonitor !== "undefined")
        systemMonitor.addLog("Weather API request failed");
      return null;
    }
  }

  async getWeatherByGPS() {
    await this.waitForConfig();
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          // Config se API key lein, agar config fail hua to empty string
          const apiKey = this.config?.apiKeys?.weather || "";

          try {
            const response = await fetch(
              `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}&aqi=no`
            );
            const data = await response.json();

            resolve({
              temp: Math.round(data.current.temp_c),
              description: data.current.condition.text,
              humidity: data.current.humidity,
              pressure: data.current.pressure_mb,
              windSpeed: data.current.wind_kph,
              city: data.location.name,
              country: data.location.country,
              lat: lat,
              lon: lon,
            });
          } catch (error) {
            reject(error);
          }
        },
        (error) => reject(error)
      );
    });
  }

  async getQuote() {
    try {
      // Aapki banayi hui file se data fetch karein
      const response = await fetch("assets/jsons/quote.json");

      if (!response.ok) {
        throw new Error("Quotes file not found");
      }

      const quotes = await response.json();

      if (!quotes || quotes.length === 0) {
        throw new Error("Quotes list is empty");
      }

      // Randomly ek quote pick karein
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

      return {
        content: randomQuote.content,
        author: randomQuote.author,
        tags: ["inspirational"],
      };
    } catch (error) {
      console.error("API Quote Error:", error);
      // Fallback agar file load na ho paye
      return {
        content: "The only way to do great work is to love what you do.",
        author: "Steve Jobs (Fallback)",
      };
    }
  }

  async getCryptoPrice(symbol = "BTC") {
    // API Call logic same as before...
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${this.getCoinId(
          symbol
        )}&vs_currencies=usd`
      );
      const data = await response.json();
      const id = this.getCoinId(symbol);
      if (data[id])
        return data[id].usd.toLocaleString("en-US", {
          minimumFractionDigits: 2,
        });
    } catch (e) {}
    return "0.00";
  }

  getCoinId(symbol) {
    const map = {
      BTC: "bitcoin",
      ETH: "ethereum",
      SOL: "solana",
      DOGE: "dogecoin",
    };
    return map[symbol.toUpperCase()] || "bitcoin";
  }

  async getNews() {
    await this.waitForConfig();
    // Return mock news from JSON
    return this.mockData?.news || [];
  }

  async getRandomJoke() {
    await this.waitForConfig();
    const jokes = this.mockData?.jokes || [
      { setup: "404", punchline: "Joke not found." },
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }
}

const apiManager = new APIManager();
