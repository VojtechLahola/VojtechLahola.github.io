const catApiUrl = "https://api.thecatapi.com/v1/images/search";
const catStorageKey = "vojtech-cat-of-the-day";
const catHistoryKey = "vojtech-cat-history";
const maxHistoryItems = 5;
const today = new Date();
const dateKey = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0"),
].join("-");

const loading = document.querySelector(".cat-loading");
const image = document.querySelector(".cat-image");
const details = document.querySelector(".cat-details");
const dateLabel = document.querySelector(".cat-date");
const sourceLink = document.querySelector(".cat-source");
const errorMessage = document.querySelector(".cat-error");
const retryButton = document.querySelector(".retry-button");
const catCurrentYear = document.querySelector("#current-year");
const historyList = document.querySelector(".cat-history-list");
const historyEmpty = document.querySelector(".cat-history-empty");

function currentLanguage() {
  return document.documentElement.lang === "en" ? "en" : "cs";
}

function translatedText(czech, english) {
  return currentLanguage() === "en" ? english : czech;
}

if (catCurrentYear) {
  catCurrentYear.textContent = new Date().getFullYear();
}

function showError() {
  loading.style.display = "none";
  errorMessage.textContent = translatedText(
    "Služba s kočkami je momentálně nedostupná. Zkuste to prosím znovu.",
    "The cat service is unavailable right now. Please try again.",
  );
  errorMessage.classList.add("is-visible");
  retryButton.classList.add("is-visible");
}

function displayCat(cat) {
  loading.style.display = "none";
  image.src = cat.url;
  image.alt = "Cat of the day";
  image.classList.add("is-visible");
  dateLabel.textContent = `${translatedText("Kočka dne", "Cat of the day")} · ${cat.date}`;
  sourceLink.href = cat.url;
  details.classList.add("is-visible");
  errorMessage.classList.remove("is-visible");
  retryButton.classList.remove("is-visible");
}

function readHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(catHistoryKey));
    if (!Array.isArray(history)) {
      return [];
    }

    const validHistory = history
      .filter((cat) => cat && typeof cat.date === "string" && typeof cat.url === "string")
      .filter((cat) => !cat.date.startsWith("Test cat") && !cat.date.startsWith("Testovací kočka"))
      .slice(0, maxHistoryItems);

    if (validHistory.length !== history.length) {
      saveHistory(validHistory);
    }

    return validHistory;
  } catch (error) {
    console.error("Unable to read the cat history:", error);
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(catHistoryKey, JSON.stringify(history.slice(0, maxHistoryItems)));
  } catch (error) {
    console.error("Unable to save the cat history:", error);
  }
}

function archiveCat(cat) {
  const history = readHistory().filter((savedCat) => savedCat.date !== cat.date);
  history.unshift(cat);
  saveHistory(history);
}

function renderHistory() {
  if (!historyList || !historyEmpty) {
    return;
  }

  const history = readHistory();
  historyList.replaceChildren();
  historyEmpty.hidden = history.length > 0;

  history.forEach((cat) => {
    const item = document.createElement("article");
    item.className = "cat-history-item";

    const thumbnail = document.createElement("img");
    thumbnail.src = cat.url;
    thumbnail.alt = `Cat of the day from ${cat.date}`;
    thumbnail.loading = "lazy";

    const date = document.createElement("p");
    date.textContent = cat.date;

    const viewLink = document.createElement("a");
    viewLink.className = "text-link";
    viewLink.href = cat.url;
    viewLink.target = "_blank";
    viewLink.rel = "noreferrer";
    viewLink.textContent = translatedText("Zobrazit ↗", "View ↗");

    const actions = document.createElement("div");
    actions.className = "cat-history-actions";
    actions.append(viewLink);
    item.append(thumbnail, date, actions);
    historyList.append(item);
  });
}

document.addEventListener("languagechange", () => {
  try {
    const savedCat = JSON.parse(localStorage.getItem(catStorageKey));
    if (savedCat && typeof savedCat.url === "string") {
      displayCat(savedCat);
    }
  } catch (error) {
    console.error("Unable to refresh the cat language:", error);
  }
  renderHistory();
});

async function fetchCat() {
  loading.style.display = "flex";
  image.classList.remove("is-visible");
  details.classList.remove("is-visible");
  errorMessage.classList.remove("is-visible");
  retryButton.classList.remove("is-visible");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(catApiUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Cat API request failed with status ${response.status}`);
    }

    const [cat] = await response.json();
    if (!cat || typeof cat.url !== "string") {
      throw new Error("Cat API returned an invalid image");
    }

    const savedCat = { date: dateKey, url: cat.url };
    const previousCat = JSON.parse(localStorage.getItem(catStorageKey));
    if (previousCat && previousCat.date !== dateKey && typeof previousCat.url === "string") {
      archiveCat(previousCat);
    }
    localStorage.setItem(catStorageKey, JSON.stringify(savedCat));
    displayCat(savedCat);
    renderHistory();
  } catch (error) {
    console.error("Unable to load cat of the day:", error);
    showError();
  } finally {
    clearTimeout(timeout);
  }
}

function loadCatOfTheDay() {
  try {
    const savedCat = JSON.parse(localStorage.getItem(catStorageKey));
    if (savedCat && savedCat.date === dateKey && typeof savedCat.url === "string") {
      displayCat(savedCat);
      renderHistory();
      return;
    }
    if (savedCat && typeof savedCat.date === "string" && typeof savedCat.url === "string") {
      archiveCat(savedCat);
    }
  } catch (error) {
    console.error("Unable to read the saved cat of the day:", error);
  }

  fetchCat();
}

retryButton.addEventListener("click", fetchCat);
renderHistory();
loadCatOfTheDay();
