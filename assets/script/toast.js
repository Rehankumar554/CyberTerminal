let toastID = 0;

function showToast(message, duration = 4200) {
  const container = document.getElementById("toastContainer");

  const toast = document.createElement("div");
  toast.className = "glass-toast";
  toast.id = "toast_" + ++toastID;
  toast.innerHTML = message;

  container.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

/* Auto-Toast After 5 Seconds */
setTimeout(() => {
  showToast("System Booted Successfully");
}, 5000);
