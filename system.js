class SystemMonitor {
  constructor() {
    this.startTime = Date.now();
    this.logs = [];
    this.cpuHistory = [];
    this.ramHistory = [];
    this.init();
  }

  init() {
    this.addLog("[INIT] System monitor started");
    this.simulateUsage();
  }

  simulateUsage() {
    setInterval(() => {
      // Simulate CPU usage with some randomness and trends
      const baseCpu = 15 + Math.sin(Date.now() / 10000) * 10;
      const cpu = Math.max(
        5,
        Math.min(95, baseCpu + (Math.random() - 0.5) * 20)
      );
      this.cpuHistory.push(cpu);
      if (this.cpuHistory.length > 60) this.cpuHistory.shift();

      // Simulate RAM usage with gradual increase
      const baseRam = 30 + (Date.now() - this.startTime) / 1000000;
      const ram = Math.max(
        20,
        Math.min(85, baseRam + (Math.random() - 0.5) * 15)
      );
      this.ramHistory.push(ram);
      if (this.ramHistory.length > 60) this.ramHistory.shift();
    }, 2000);
  }

  getCpuUsage() {
    if (this.cpuHistory.length === 0) return 0;
    return Math.round(this.cpuHistory[this.cpuHistory.length - 1]);
  }

  getRamUsage() {
    if (this.ramHistory.length === 0) return 0;
    return Math.round(this.ramHistory[this.ramHistory.length - 1]);
  }

  getUptime() {
    const ms = Date.now() - this.startTime;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  getSystemInfo() {
    const uptime = this.getUptime();
    const cpu = this.getCpuUsage();
    const ram = this.getRamUsage();

    return {
      OS: "CyberTerm Linux",
      Kernel: "5.15.0-cyber",
      Architecture: "x86_64",
      Shell: "cybershell v1.0",
      Terminal: "cyberterm",
      "CPU Usage": `${cpu}%`,
      "RAM Usage": `${ram}%`,
      Uptime: uptime,
      Hostname: "cyberterm",
      User: "user",
      Home: "/home/user",
      "Shell Path": "/bin/cybershell",
    };
  }

  addLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);

    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs.shift();
    }

    // Update logs display
    const logsDisplay = document.getElementById("logs-display");
    if (logsDisplay) {
      const recentLogs = this.logs.slice(-10);
      logsDisplay.innerHTML = recentLogs
        .map((log) => `<div class="log-entry">${log}</div>`)
        .join("");
    }
  }

  getLogs() {
    return this.logs;
  }

  simulateLatencyTest() {
    const hosts = [
      { name: "google.com", latency: Math.random() * 30 + 10 },
      { name: "github.com", latency: Math.random() * 40 + 15 },
      { name: "cloudflare.com", latency: Math.random() * 20 + 5 },
    ];

    return hosts.map((host) => ({
      ...host,
      latency: Math.round(host.latency * 10) / 10,
    }));
  }

  simulateTraceroute(host) {
    const hops = Math.floor(Math.random() * 8) + 8;
    const route = [];

    for (let i = 1; i <= hops; i++) {
      const ip = `${Math.floor(Math.random() * 256)}.${Math.floor(
        Math.random() * 256
      )}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
      const latency = Math.round((Math.random() * 50 + i * 5) * 10) / 10;
      route.push({
        hop: i,
        ip: ip,
        latency: latency,
      });
    }

    return route;
  }

  getProcessList() {
    const processes = [
      { pid: 1, name: "systemd", cpu: 0.1, mem: 0.5 },
      {
        pid: 234,
        name: "cyberterm",
        cpu: this.getCpuUsage() / 10,
        mem: this.getRamUsage() / 10,
      },
      { pid: 456, name: "matrix-render", cpu: 5.2, mem: 8.3 },
      { pid: 789, name: "widget-manager", cpu: 2.1, mem: 4.7 },
      { pid: 1012, name: "fs-daemon", cpu: 1.3, mem: 2.9 },
      { pid: 1234, name: "api-service", cpu: 0.8, mem: 3.2 },
      { pid: 1456, name: "theme-engine", cpu: 0.5, mem: 1.8 },
    ];

    return processes;
  }

  getDiskUsage() {
    return {
      total: "100GB",
      used: "42GB",
      available: "58GB",
      percent: 42,
    };
  }

  getNetworkStats() {
    return {
      rx: `${Math.floor(Math.random() * 1000 + 500)} KB/s`,
      tx: `${Math.floor(Math.random() * 500 + 100)} KB/s`,
      packets_rx: Math.floor(Math.random() * 10000 + 5000),
      packets_tx: Math.floor(Math.random() * 8000 + 3000),
    };
  }

  getMemoryDetails() {
    const total = 16384; // 16GB in MB
    const used = Math.floor(total * (this.getRamUsage() / 100));
    const free = total - used;
    const cached = Math.floor(Math.random() * 2000 + 1000);

    return {
      total: `${total} MB`,
      used: `${used} MB`,
      free: `${free} MB`,
      cached: `${cached} MB`,
      available: `${free + cached} MB`,
    };
  }

  getCpuInfo() {
    return {
      model: "Intel Core i7-9700K @ 3.60GHz",
      cores: 8,
      threads: 16,
      cache: "12 MB",
      governor: "performance",
    };
  }
}

// Initialize system monitor
const systemMonitor = new SystemMonitor();
