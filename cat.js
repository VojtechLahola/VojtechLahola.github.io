const catApiUrl = "https://api.thecatapi.com/v1/images/search";
const catStorageKey = "vojtech-cat-of-the-day";
const catHistoryKey = "vojtech-cat-history";
const maxHistoryItems = 5;
const testHistory = [
  { date: "Test cat 01", url: "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=320&h=220&fit=crop" },
  { date: "Test cat 02", url: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=320&h=220&fit=crop" },
  { date: "Test cat 03", url: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=320&h=220&fit=crop" },
  { date: "Test cat 04", url: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=320&h=220&fit=crop" },
  { date: "Test cat 05", url: "https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?w=320&h=220&fit=crop" },
];
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

if (catCurrentYear) {
  catCurrentYear.textContent = new Date().getFullYear();
}

function showError() {
  loading.style.display = "none";
  errorMessage.textContent = "The cat service is unavailable right now. Please try again.";
  errorMessage.classList.add("is-visible");
  retryButton.classList.add("is-visible");
}

function displayCat(cat) {
  loading.style.display = "none";
  image.src = cat.url;
  image.alt = "Cat of the day";
  image.classList.add("is-visible");
  dateLabel.textContent = `Cat of the day · ${cat.date}`;
  sourceLink.href = cat.url;
  details.classList.add("is-visible");
  errorMessage.classList.remove("is-visible");
  retryButton.classList.remove("is-visible");
}

function readHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(catHistoryKey));
    return Array.isArray(history)
      ? history.filter((cat) => cat && typeof cat.date === "string" && typeof cat.url === "string").slice(0, maxHistoryItems)
      : [];
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

function ensureHistory() {
  const history = readHistory();
  if (history.length > 0) {
    return history;
  }

  saveHistory(testHistory);
  return testHistory;
}

function renderHistory() {
  if (!historyList || !historyEmpty) {
    return;
  }

  const history = ensureHistory();
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
    viewLink.textContent = "View ↗";

    const download = document.createElement("a");
    download.className = "text-link";
    download.href = cat.url;
    download.download = `cat-of-the-day-${cat.date}`;
    download.textContent = "Save ↓";

    const actions = document.createElement("div");
    actions.className = "cat-history-actions";
    actions.append(viewLink, download);
    item.append(thumbnail, date, actions);
    historyList.append(item);
  });
}

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
