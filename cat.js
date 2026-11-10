const catApiUrl = "https://api.thecatapi.com/v1/images/search";
const catStorageKey = "vojtech-cat-of-the-day";
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
  dateLabel.textContent = `Cat of the day · ${dateKey}`;
  sourceLink.href = cat.url;
  details.classList.add("is-visible");
  errorMessage.classList.remove("is-visible");
  retryButton.classList.remove("is-visible");
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
    localStorage.setItem(catStorageKey, JSON.stringify(savedCat));
    displayCat(savedCat);
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
      return;
    }
  } catch (error) {
    console.error("Unable to read the saved cat of the day:", error);
  }

  fetchCat();
}

retryButton.addEventListener("click", fetchCat);
loadCatOfTheDay();
