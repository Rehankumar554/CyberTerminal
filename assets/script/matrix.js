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
    window.addEventListener("resize", () => this.resizeCanvas());
    this.animate();
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

class RadarScanner {
  constructor() {
    this.canvas = document.getElementById("radar-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.angle = 0;
    this.blips = [];
    this.generateBlips();
    this.animate();
  }

  generateBlips() {
    for (let i = 0; i < 15; i++) {
      this.blips.push({
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * 80 + 10,
        opacity: Math.random() * 0.5 + 0.5,
      });
    }
  }

  draw() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Clear canvas
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid circles
    this.ctx.strokeStyle = "#00ff0033";
    this.ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, (radius / 3) * i, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Draw crosshairs
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY - radius);
    this.ctx.lineTo(centerX, centerY + radius);
    this.ctx.moveTo(centerX - radius, centerY);
    this.ctx.lineTo(centerX + radius, centerY);
    this.ctx.stroke();

    // Draw scanning line
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(this.angle);

    const gradient = this.ctx.createLinearGradient(0, 0, radius, 0);
    gradient.addColorStop(0, "rgba(0, 255, 0, 0)");
    gradient.addColorStop(0.5, "rgba(0, 255, 0, 0.3)");
    gradient.addColorStop(1, "rgba(0, 255, 0, 0.8)");

    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(radius, 0);
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.restore();

    // Draw blips
    this.blips.forEach((blip) => {
      const x = centerX + Math.cos(blip.angle) * blip.distance;
      const y = centerY + Math.sin(blip.angle) * blip.distance;

      this.ctx.fillStyle = `rgba(0, 255, 0, ${blip.opacity})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 3, 0, Math.PI * 2);
      this.ctx.fill();

      // Fade blips that the scanner has passed
      const angleDiff = Math.abs(this.angle - blip.angle);
      if (angleDiff < 0.5 || angleDiff > Math.PI * 2 - 0.5) {
        blip.opacity = Math.min(1, blip.opacity + 0.1);
      } else {
        blip.opacity = Math.max(0.1, blip.opacity - 0.01);
      }
    });

    this.angle += 0.02;
    if (this.angle > Math.PI * 2) {
      this.angle = 0;
    }
  }

  animate() {
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}

class BootSequence {
  constructor() {
    this.overlay = document.getElementById("boot-sequence");
    this.textElement = document.getElementById("boot-text");

    // --- NEW LOGIC START ---
    // Check settings from LocalStorage
    const savedSettings = localStorage.getItem("terminalSettings");
    const settings = savedSettings ? JSON.parse(savedSettings) : {};

    // Agar setting me skipBoot true hai, to overlay chupao aur return kar jao
    if (settings.skipBoot) {
      if (this.overlay) {
        this.overlay.style.display = "none"; // Hide immediately
        this.overlay.style.opacity = "0";
        this.overlay.style.pointerEvents = "none";
      }
      return; // Stop execution here
    }
    // --- NEW LOGIC END ---

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

  // Baaki methods (start, showNextMessage) same rahenge...
  start() {
    this.showNextMessage();
  }

  showNextMessage() {
    if (this.currentIndex < this.messages.length) {
      this.textElement.textContent += this.messages[this.currentIndex] + "\n";
      this.currentIndex++;
      setTimeout(() => this.showNextMessage(), 150);
    }
  }
}

// Initialize animations
window.addEventListener("DOMContentLoaded", () => {
  // Delay initialization slightly to ensure DOM is fully ready
  setTimeout(() => {
    new BootSequence();
    new MatrixRain();
    new RadarScanner();
  }, 100);
});
