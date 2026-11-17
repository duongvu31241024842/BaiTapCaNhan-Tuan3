// Hiển thị năm hiện tại ở chân trang
document.getElementById("year").textContent = new Date().getFullYear();

// Nút chuyển chế độ sáng/tối
var root = document.documentElement;
var toggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
    toggle.textContent = "Chế độ sáng";
  } else {
    root.removeAttribute("data-theme");
    toggle.textContent = "Chế độ tối";
  }
}

try {
  applyTheme(localStorage.getItem("theme"));
} catch (e) {
  applyTheme("light");
}

toggle.addEventListener("click", function () {
  var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem("theme", next); } catch (e) {}
});