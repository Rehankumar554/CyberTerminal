window.WindowManager = class WindowManager {
  constructor(modalId, headerId, contentId) {
    this.modal = document.getElementById(modalId);
    this.header = document.getElementById(headerId);
    this.content = document.getElementById(contentId);

    // State
    this.isMinimized = false;
    this.preMinimizeHeight = "";

    if (this.modal && this.header) {
      this.initDrag();
      this.initResize();
    }
  }

  // --- 1. DRAG LOGIC ---
  initDrag() {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    this.header.style.cursor = "move";

    this.header.addEventListener("mousedown", (e) => {
      // Button click par drag na ho
      if (e.target.tagName === "BUTTON" || e.target.closest("button")) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = this.modal.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      // Center transform hatana zaroori hai
      this.modal.style.transform = "none";
      this.modal.style.left = `${initialLeft}px`;
      this.modal.style.top = `${initialTop}px`;
      this.modal.style.bottom = "auto";
      this.modal.style.right = "auto";

      const onMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        this.modal.style.left = `${initialLeft + dx}px`;
        this.modal.style.top = `${initialTop + dy}px`;
      };

      const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  }

  // --- 2. RESIZE LOGIC ---
  initResize() {
    const handles = ["nw", "ne", "sw", "se", "n", "e", "s", "w"];
    handles.forEach((dir) => {
      const el = document.createElement("div");
      el.className = `resizer ${dir}`;
      this.modal.appendChild(el);
      this.setupResizer(el, dir);
    });
  }

  setupResizer(el, dir) {
    el.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation(); // Event bubble roka
      const startX = e.clientX;
      const startY = e.clientY;
      const startRect = this.modal.getBoundingClientRect();

      const onResize = (e) => {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (dir.includes("e"))
          this.modal.style.width = `${startRect.width + dx}px`;
        if (dir.includes("s"))
          this.modal.style.height = `${startRect.height + dy}px`;

        if (dir.includes("w")) {
          this.modal.style.width = `${startRect.width - dx}px`;
          this.modal.style.left = `${startRect.left + dx}px`;
        }
        if (dir.includes("n")) {
          this.modal.style.height = `${startRect.height - dy}px`;
          this.modal.style.top = `${startRect.top + dy}px`;
        }
      };

      const stopResize = () => {
        document.removeEventListener("mousemove", onResize);
        document.removeEventListener("mouseup", stopResize);
      };

      document.addEventListener("mousemove", onResize);
      document.addEventListener("mouseup", stopResize);
    });
  }

  // --- 3. MINIMIZE LOGIC ---
  toggleMinimize() {
    if (this.isMinimized) {
      // Restore
      this.content.style.display = "flex";
      this.modal.style.height = this.preMinimizeHeight;
      this.modal.classList.remove("wh-minimized");
      this.isMinimized = false;
    } else {
      // Minimize
      this.preMinimizeHeight =
        this.modal.style.height || this.modal.offsetHeight + "px";
      this.content.style.display = "none";
      this.modal.style.height = "auto";
      this.modal.classList.add("wh-minimized");
      this.isMinimized = true;
    }
  }

  // Reset state when closed/reopened
  reset() {
    if (this.isMinimized) {
      this.toggleMinimize();
    }
  }
};
