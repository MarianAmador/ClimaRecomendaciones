import { showRecommendations } from "./recommendations.js";

const API_KEY = "6893659828e9db9da030b84d1960c821";
const regionNames = new Intl.DisplayNames(["es"], { type: "region" });

const els = {
    result: document.getElementById("weatherResult"),
    buttons: document.getElementById("actionButtons"),
    searchBtn: document.getElementById("searchBtn"),
    cityInput: document.getElementById("cityInput"),
    forecast: document.getElementById("forecast"),
    recent: document.getElementById("recentList"),
    favs: document.getElementById("favoritesList"),
    suggestions: document.getElementById("cityOptions"),
    rec: document.getElementById("recommendations"),
    status: document.getElementById("connectionStatus")
};

let debounceTimer;
let selectedName = "";

const CB = {
    state: "CLOSED",
    failures: 0,
    maxFailures: 3,
    lastFailure: 0,
    resetAfter: 30000
};

async function resilientFetch(url, retries = 2, wait = 1000) {
    if (CB.state === "OPEN") {
        if (Date.now() - CB.lastFailure > CB.resetAfter) {
            CB.state = "HALF_OPEN";
        } else {
            if (els.status) els.status.textContent = "No se pudo conectar. Intenta más tarde.";
            throw new Error("OFFLINE");
        }
    }

    try {
        const res = await fetch(url);
        if (res.status === 404) throw new Error("NOT_FOUND");
        if (!res.ok) throw new Error("API_ERROR");
        const data = await res.json();
        CB.state = "CLOSED";
        CB.failures = 0;
        if (els.status) els.status.textContent = "";
        return data;
    } catch (err) {
        if (err.message === "NOT_FOUND") throw err;
        if (retries > 0) {
            if (els.status) els.status.textContent = "Conectando…";
            await new Promise(r => setTimeout(r, wait));
            return resilientFetch(url, retries - 1, wait * 2);
        }
        CB.failures++;
        CB.lastFailure = Date.now();
        if (CB.failures >= CB.maxFailures) CB.state = "OPEN";
        throw new Error("OFFLINE");
    }
}

els.cityInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const q = els.cityInput.value.trim();
    if (q.length < 3) {
        els.suggestions.style.display = "none";
        return;
    }

    debounceTimer = setTimeout(async () => {
        try {
            const data = await resilientFetch(
                `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${API_KEY}`
            );

            els.suggestions.replaceChildren();
            if (!data.length) return;

            els.suggestions.style.display = "block";

            data.forEach(c => {
                const div = document.createElement("div");
                div.className = "suggestion-item";
                const name = `${c.name}${c.state ? ", " + c.state : ""}, ${regionNames.of(c.country)}`;
                div.textContent = name;
                div.onclick = () => {
                    els.cityInput.value = name;
                    selectedName = name;
                    els.suggestions.style.display = "none";
                    getWeather(c.lat, c.lon);
                };
                els.suggestions.appendChild(div);
            });
        } catch {}
    }, 300);
});

async function getWeather(lat, lon, query = null) {
    els.result.replaceChildren();
    els.buttons.style.display = "none";
    els.forecast.replaceChildren();
    els.rec.replaceChildren();

    const loading = document.createElement("p");
    loading.textContent = `Consultando el clima en ${selectedName || query || "la ciudad"}...`;
    els.result.appendChild(loading);

    try {
        const url = lat && lon
            ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`
            : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&appid=${API_KEY}&units=metric&lang=es`;

        const data = await resilientFetch(url);
        const displayName = selectedName || `${data.name}, ${regionNames.of(data.sys.country)}`;

        const h2 = document.createElement("h2");
        h2.textContent = displayName;

        const img = document.createElement("img");
        img.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

        const desc = document.createElement("p");
        desc.textContent = data.weather[0].description;

        const temp = document.createElement("div");
        temp.className = "temp";
        temp.textContent = `${Math.round(data.main.temp)}°C`;

        els.result.replaceChildren(h2, img, desc, temp);

        els.buttons.style.display = "flex";
        els.buttons.replaceChildren();

        const btnRec = document.createElement("button");
        btnRec.textContent = "Actividades";
        btnRec.onclick = () => {
            els.rec.childNodes.length
                ? els.rec.replaceChildren()
                : showRecommendations(data.weather[0].main, data.name);
        };

        const btnFav = document.createElement("button");
        btnFav.textContent = "⭐";
        btnFav.onclick = () => {
            saveFavorite(displayName);
            if (els.status) {
                els.status.textContent = "Guardado en favoritos";
                setTimeout(() => {
                    if (els.status.textContent.includes("Guardado")) els.status.textContent = "";
                }, 3000);
            }
        };

        els.buttons.append(btnRec, btnFav);

        saveRecent(displayName);
        getForecast(lat, lon, query);
    } catch (err) {
        els.result.replaceChildren();
        const p = document.createElement("p");
        p.style.color = err.message === "NOT_FOUND" ? "orange" : "red";
        p.textContent = err.message === "NOT_FOUND"
            ? "No se encontró la ciudad."
            : "No hay conexión. Revisa tu conexión a internet.";
        els.result.appendChild(p);
    }
}

async function getForecast(lat, lon, query) {
    const url = lat && lon
        ? `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`
        : `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(query)}&appid=${API_KEY}&units=metric&lang=es`;

    try {
        const data = await resilientFetch(url);
        els.forecast.replaceChildren();

        data.list.filter((_, i) => i % 8 === 0).forEach(d => {
            const card = document.createElement("div");
            card.className = "forecast-card";

            const date = document.createElement("p");
            const dt = new Date(d.dt_txt);
            date.textContent = `${dt.getDate()}/${dt.getMonth() + 1}`;

            const img = document.createElement("img");
            img.src = `https://openweathermap.org/img/wn/${d.weather[0].icon}.png`;

            const temp = document.createElement("p");
            temp.textContent = `${Math.round(d.main.temp)}°C`;

            card.append(date, img, temp);
            els.forecast.appendChild(card);
        });
    } catch {}
}

const getStore = k =>
    (JSON.parse(localStorage.getItem(k)) || [])
        .filter(v => typeof v === "string" && v !== "[object Object]");

const setStore = (k, v) =>
    localStorage.setItem(k, JSON.stringify(v));

function saveFavorite(name) {
    const list = getStore("favorites");
    if (!list.includes(name)) {
        list.push(name);
        setStore("favorites", list);
        renderList("favorites", els.favs);
    }
}

function saveRecent(name) {
    const list = getStore("recents").filter(n => n !== name);
    list.unshift(name);
    setStore("recents", list.slice(0, 5));
    renderList("recents", els.recent);
}

function renderList(key, el) {
    if (!el) return;
    el.replaceChildren();

    getStore(key).forEach(item => {
        const li = document.createElement("li");

        const span = document.createElement("span");
        span.textContent = item;
        span.onclick = () => {
            selectedName = item;
            getWeather(null, null, item);
        };

        const btn = document.createElement("button");
        btn.textContent = "✖";
        btn.onclick = e => {
            e.stopPropagation();
            setStore(key, getStore(key).filter(v => v !== item));
            renderList(key, el);
        };

        li.append(span, btn);
        el.appendChild(li);
    });
}

els.searchBtn.onclick = () => {
    selectedName = "";
    getWeather(null, null, els.cityInput.value);
};

document.getElementById("clearRecentBtn").onclick = () => {
    setStore("recents", []);
    renderList("recents", els.recent);
};

renderList("favorites", els.favs);
renderList("recents", els.recent);
