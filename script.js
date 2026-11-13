const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");
const currentYear = document.querySelector("#current-year");
const languageKey = "vojtech-language";
const languageButtons = document.querySelectorAll(".language-toggle");

function applyLanguage(language) {
  document.documentElement.lang = language === "en" ? "en" : "cs";
  document.title = document.body.dataset[language === "en" ? "titleEn" : "titleCs"] || document.title;
  document.querySelectorAll("[data-cs][data-en]").forEach((element) => {
    const text = element.dataset[language === "en" ? "en" : "cs"];
    if (text.includes("<")) {
      element.innerHTML = text;
    } else {
      element.textContent = text;
    }
  });
  languageButtons.forEach((button) => {
    const english = language === "en";
    button.textContent = english ? "CS" : "EN";
    button.setAttribute("aria-label", english ? "Switch to Czech" : "Přepnout do angličtiny");
    button.setAttribute("aria-pressed", String(english));
  });
  document.dispatchEvent(new CustomEvent("languagechange", { detail: language }));
}

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

let savedLanguage = "cs";
try {
  savedLanguage = localStorage.getItem(languageKey) === "en" ? "en" : "cs";
} catch (error) {
  console.error("Unable to read the saved language:", error);
}
applyLanguage(savedLanguage);

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextLanguage = document.documentElement.lang === "en" ? "cs" : "en";
    try {
      localStorage.setItem(languageKey, nextLanguage);
    } catch (error) {
      console.error("Unable to save the selected language:", error);
    }
    applyLanguage(nextLanguage);
  });
});

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      siteNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });
}
