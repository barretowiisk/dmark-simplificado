"use strict";
(() => {
  const button = document.querySelector("#themeToggle");
  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("dmarc-theme", theme);
    if (button) {
      button.setAttribute("aria-label", theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro");
      button.title = button.getAttribute("aria-label");
    }
  };
  applyTheme(document.documentElement.dataset.theme || "light");
  button?.addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
})();
