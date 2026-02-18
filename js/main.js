import { getWeather } from "./api.js";

const form = document.getElementById("weatherForm");
const cityInput = document.getElementById("cityInput");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const city = cityInput.value.trim();

  if (city === "") {
    document.getElementById("weatherResult").textContent =
      "Escribe una ciudad válida";
    return;
  }

  getWeather(city);
});
