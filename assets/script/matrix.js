class MatrixRain {
  constructor() {
    this.canvas = document.getElementById("matrix-canvas");
    this.ctx = this.canvas.getContext("2d");

    this.fontSize = 14;
    this.columns = 0;
    this.drops = [];
    this.chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,.<>?/~`";

    this.init();
  }

  init() {
    this.resizeCanvas();

    // Fix: Resize event par Debounce lagaya hai (300ms delay)
    // Ab browser hang nahi hoga resize karte waqt
    const debouncedResize = this.debounce(() => this.resizeCanvas(), 300);
    window.addEventListener("resize", debouncedResize);

    this.animate();
  }

  // --- NEW HELPER METHOD: DEBOUNCE ---
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  resizeCanvas() {
    const width =
      window.innerWidth || document.documentElement.clientWidth || 800;
    const height =
      window.innerHeight || document.documentElement.clientHeight || 600;

    this.canvas.width = Math.max(100, width);
    this.canvas.height = Math.max(100, height);
    this.columns = Math.max(10, Math.floor(this.canvas.width / this.fontSize));
    this.drops = new Array(this.columns).fill(1);
  }

  draw() {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = "#0f0";
    this.ctx.font = `${this.fontSize}px monospace`;

    for (let i = 0; i < this.drops.length; i++) {
      const char = this.chars[Math.floor(Math.random() * this.chars.length)];
      const x = i * this.fontSize;
      const y = this.drops[i] * this.fontSize;

      this.ctx.fillText(char, x, y);

      if (y > this.canvas.height && Math.random() > 0.975) {
        this.drops[i] = 0;
      }

      this.drops[i]++;
    }
  }

  animate() {
    this.draw();
    setTimeout(() => {
      requestAnimationFrame(() => this.animate());
    }, 33);
  }
}

class BootSequence {
  constructor() {
    this.overlay = document.getElementById("boot-sequence");
    this.textElement = document.getElementById("boot-text");

    // Check settings from LocalStorage
    const savedSettings = localStorage.getItem("terminalSettings");
    const settings = savedSettings ? JSON.parse(savedSettings) : {};

    // Agar setting me skipBoot true hai, to overlay chupao aur return kar jao
    if (settings.skipBoot) {
      if (this.overlay) {
        this.overlay.style.display = "none";
        this.overlay.style.opacity = "0";
        this.overlay.style.pointerEvents = "none";
      }
      document.dispatchEvent(new Event("boot-finished"));
      return;
    }

    this.messages = [
      "[ OK ] Starting CyberTerm Boot Sequence...",
      "[ OK ] Loading kernel modules...",
      "[ OK ] Initializing virtual filesystem...",
      "[ OK ] Starting network services...",
      "[ OK ] Mounting /dev/cyber0...",
      "[ OK ] Loading system configurations...",
      "[ OK ] Starting terminal emulator...",
      "[ OK ] Initializing security protocols...",
      "[ OK ] Loading encryption modules...",
      "[ OK ] Starting widget services...",
      "[ OK ] Connecting to API endpoints...",
      "[ OK ] System ready.",
      "",
      "CyberTerm Linux 5.15.0-cyber (tty1)",
      "",
      "cyberterm login: user",
      "Password: ********",
      "Last login: " + new Date().toLocaleString(),
      "",
      "Welcome to CyberTerm Linux!",
      "",
    ];
    this.currentIndex = 0;
    this.start();
  }

  start() {
    this.showNextMessage();
  }

  showNextMessage() {
    if (this.currentIndex < this.messages.length) {
      this.textElement.textContent += this.messages[this.currentIndex] + "\n";
      this.currentIndex++;
      setTimeout(() => this.showNextMessage(), 150);
    } else {
      // Animation complete signal
      setTimeout(() => {
        document.dispatchEvent(new Event("boot-finished"));
      }, 500);
    }
  }
}

// Initialize animations
window.addEventListener("DOMContentLoaded", () => {
  // Delay initialization slightly to ensure DOM is fully ready
  setTimeout(() => {
    new BootSequence();
    new MatrixRain();
  }, 100);
});
