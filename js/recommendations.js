export function showRecommendations(weather, city) {
  const rec = document.getElementById("recommendations");
  if (!rec) return;
  rec.innerHTML = "";
  let activities = [];
  if (weather === "Clear") {
    activities = ["☀️ Caminar por el parque", "🏖️ Ir a la playa", "🚴 Ruta en bicicleta", "📸 Fotos al aire libre"];
  } else if (["Clouds", "Mist", "Haze", "Fog"].includes(weather)) {
    activities = ["☁️ Pasear por la ciudad", "☕ Visitar una cafetería", "🏛️ Museos locales", "🛍️ Ir de compras"];
  } else if (["Rain", "Drizzle", "Thunderstorm"].includes(weather)) {
    activities = ["🌧️ Cine o Teatro", "📚 Leer en una librería", "🖼️ Galerías de arte", "🏠 Tarde de juegos"];
  } else if (weather === "Snow") {
    activities = ["❄️ Paisajes nevados", "⛄ Muñeco de nieve", "🔥 Chocolate caliente", "📷 Fotos invernales"];
  } else {
    activities = ["🌍 Explorar la ciudad", "🍽️ Gastronomía local", "🚶 Tour a pie", "🎶 Eventos locales"];
  }
  const h3 = document.createElement("h3");
  h3.textContent = `✨ Actividades en ${city}`;
  const ul = document.createElement("ul");
  activities.forEach(act => {
    const li = document.createElement("li");
    li.textContent = act;
    ul.appendChild(li);
  });
  rec.appendChild(h3);
  rec.appendChild(ul);
}