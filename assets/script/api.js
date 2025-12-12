class APIManager {
  constructor() {
    // Hardcoded WeatherAPI key
    this.weatherApiKey = "794f3ea37db442de8f642856250712";
    this.weatherCity = "";
  }

  async getWeather() {
    try {
      // Get GPS location first
      const gpsData = await this.getWeatherByGPS();
      return gpsData;
    } catch (error) {
      console.error("Weather API error:", error);
      systemMonitor.addLog("Weather API request failed");
      return null;
    }
  }

  async getWeatherByLocation(location) {
    if (!this.weatherApiKey) {
      console.log("Weather API key not configured");
      return null;
    }

    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${this.weatherApiKey}&q=${location}&aqi=no`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        temp: Math.round(data.current.temp_c),
        description: data.current.condition.text,
        humidity: data.current.humidity,
        pressure: data.current.pressure_mb,
        windSpeed: data.current.wind_kph,
        city: data.location.name,
        country: data.location.country,
      };
    } catch (error) {
      console.error("Weather API error:", error);
      return null;
    }
  }

  async getWeatherByGPS() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          try {
            const response = await fetch(
              `https://api.weatherapi.com/v1/current.json?key=${this.weatherApiKey}&q=${lat},${lon}&aqi=no`
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
        (error) => {
          reject(error);
        }
      );
    });
  }

  async getQuote() {
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
      { content: "Think twice, code once.", author: "Anonymous" },
      { content: "Knowledge is power.", author: "Francis Bacon" },
      {
        content: "Simplicity is the soul of efficiency.",
        author: "Austin Freeman",
      },
      {
        content: "Make it work, make it right, make it fast.",
        author: "Kent Beck",
      },
    ];

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    return {
      content: randomQuote.content,
      author: randomQuote.author,
      tags: ["inspirational"],
    };
  }

  async getCryptoPrice(symbol = "BTC") {
    const coinMap = {
      BTC: "bitcoin",
      ETH: "ethereum",
      ADA: "cardano",
      DOT: "polkadot",
      SOL: "solana",
      MATIC: "matic-network",
      AVAX: "avalanche-2",
      LINK: "chainlink",
    };

    const coinId = coinMap[symbol.toUpperCase()] || "bitcoin";

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data[coinId] && data[coinId].usd) {
        return data[coinId].usd.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }

      return this.getCryptoPriceFallback(symbol);
    } catch (error) {
      console.error("Crypto API error:", error);
      systemMonitor.addLog("Crypto API request failed");
      return this.getCryptoPriceFallback(symbol);
    }
  }

  getCryptoPriceFallback(symbol) {
    // Fallback simulated prices
    const prices = {
      BTC: 43250 + (Math.random() - 0.5) * 2000,
      ETH: 2280 + (Math.random() - 0.5) * 100,
      ADA: 0.52 + (Math.random() - 0.5) * 0.05,
      DOT: 7.3 + (Math.random() - 0.5) * 0.5,
      SOL: 98.5 + (Math.random() - 0.5) * 5,
      MATIC: 0.85 + (Math.random() - 0.5) * 0.08,
      AVAX: 36.2 + (Math.random() - 0.5) * 2,
      LINK: 14.5 + (Math.random() - 0.5) * 1,
    };

    const price = prices[symbol.toUpperCase()] || prices["BTC"];

    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  async getCryptoDetails(symbol = "BTC") {
    const coinMap = {
      BTC: "bitcoin",
      ETH: "ethereum",
    };

    const coinId = coinMap[symbol.toUpperCase()] || "bitcoin";

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data[coinId]) {
        return {
          price: data[coinId].usd,
          change24h: data[coinId].usd_24h_change || 0,
          marketCap: data[coinId].usd_market_cap || 0,
          volume24h: data[coinId].usd_24h_vol || 0,
        };
      }

      return this.getCryptoDetailsFallback(symbol);
    } catch (error) {
      console.error("Crypto API error:", error);
      return this.getCryptoDetailsFallback(symbol);
    }
  }

  getCryptoDetailsFallback(symbol) {
    const details = {
      BTC: {
        price: 43250 + (Math.random() - 0.5) * 2000,
        change24h: (Math.random() - 0.5) * 10,
        marketCap: 845000000000,
        volume24h: 28000000000,
      },
      ETH: {
        price: 2280 + (Math.random() - 0.5) * 100,
        change24h: (Math.random() - 0.5) * 8,
        marketCap: 274000000000,
        volume24h: 12000000000,
      },
    };

    return details[symbol.toUpperCase()] || details["BTC"];
  }

  async getNews() {
    // Return demo news with realistic current tech topics
    return this.getDemoNews();
  }

  getDemoNews() {
    const newsItems = [
      {
        title: "Advanced AI Models Reshape Software Development Landscape",
        description:
          "New AI-powered coding assistants are transforming how developers write and debug code.",
        url: "https://example.com/ai-development",
        source: "Tech Today",
      },
      {
        title:
          "Quantum Computing Breakthrough: New Algorithm Solves Complex Problems",
        description:
          "Researchers announce significant advancement in quantum computing efficiency.",
        url: "https://example.com/quantum-breakthrough",
        source: "Science Daily",
      },
      {
        title: "Cybersecurity Alert: New Zero-Day Vulnerabilities Discovered",
        description:
          "Security experts urge immediate patching as critical vulnerabilities are identified.",
        url: "https://example.com/security-alert",
        source: "Security Watch",
      },
      {
        title: "Open Source Movement Gains Momentum in Enterprise Adoption",
        description:
          "Major corporations increase investment in open source projects and communities.",
        url: "https://example.com/opensource-growth",
        source: "Developer News",
      },
      {
        title:
          "Cloud Computing Costs: New Study Reveals Optimization Strategies",
        description:
          "Companies can reduce cloud spending by up to 40% with proper architecture.",
        url: "https://example.com/cloud-optimization",
        source: "Cloud Weekly",
      },
    ];

    // Randomize and return 3 items
    const shuffled = newsItems.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  async getGitHubTrending() {
    // Simulated trending repos
    const repos = [
      {
        name: "microsoft/vscode",
        description: "Visual Studio Code - Open source code editor",
        stars: 152000,
        language: "TypeScript",
        url: "https://github.com/microsoft/vscode",
      },
      {
        name: "torvalds/linux",
        description: "Linux kernel source tree",
        stars: 168000,
        language: "C",
        url: "https://github.com/torvalds/linux",
      },
      {
        name: "facebook/react",
        description:
          "A declarative, efficient, and flexible JavaScript library for building user interfaces",
        stars: 218000,
        language: "JavaScript",
        url: "https://github.com/facebook/react",
      },
    ];

    return repos;
  }

  async getIPInfo() {
    // Simulated IP info
    return {
      ip: `${Math.floor(Math.random() * 256)}.${Math.floor(
        Math.random() * 256
      )}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
    };
  }

  async getRandomJoke() {
    const jokes = [
      {
        setup: "Why do programmers prefer dark mode?",
        punchline: "Because light attracts bugs!",
      },
      {
        setup: "How many programmers does it take to change a light bulb?",
        punchline: "None. It's a hardware problem!",
      },
      {
        setup: "Why do Java developers wear glasses?",
        punchline: "Because they don't C#!",
      },
      {
        setup: "What's a programmer's favorite hangout place?",
        punchline: "Foo Bar!",
      },
      {
        setup: "Why did the programmer quit his job?",
        punchline: "Because he didn't get arrays!",
      },
    ];

    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  async getExchangeRate(from = "USD", to = "EUR") {
    // Simulated exchange rates
    const rates = {
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.5,
      CAD: 1.36,
      AUD: 1.53,
      CHF: 0.88,
      CNY: 7.24,
      INR: 83.12,
    };

    return {
      from: from,
      to: to,
      rate: rates[to] || 1.0,
      date: new Date().toISOString().split("T")[0],
    };
  }
}

// Initialize API manager
const apiManager = new APIManager();
