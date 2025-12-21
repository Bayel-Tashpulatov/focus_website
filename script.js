const translations = {
  en: {
    pomodoro: "Focus Timer",
    clock_view: "Wall Clock",
    focus_label: "Focus:",
    break_label: "Break:",
    min: "min",
    ready: "Ready to Focus",
    focus_active: "Focus Time",
    break_active: "Break Time",
    tick: "Tick",
    ticking: "Ticking",
    start: "START SESSION",
    pause: "PAUSE",
    break_auto: "Break Time! (Auto-started)",
    focus_ready: "Focus Time! Ready?",
    input_placeholder: "What is your main goal?",
    dev: "Dev",
    rain: "Rain",
    fire: "Fire",
    cafe: "Cafe",
    wind: "Wind",
    forest: "Forest",
  },
  ru: {
    pomodoro: "Помодоро",
    clock_view: "Часы",
    focus_label: "Фокус:",
    break_label: "Отдых:",
    min: "мин",
    ready: "Готов к работе",
    focus_active: "Время фокуса",
    break_active: "Перерыв",
    tick: "Тик",
    ticking: "Тикает",
    start: "НАЧАТЬ",
    pause: "ПАУЗА",
    break_auto: "Перерыв! (Авто-старт)",
    focus_ready: "Время фокуса! Готовы?",
    input_placeholder: "Какая ваша главная цель?",
    dev: "Разработчик",
    rain: "Дождь",
    fire: "Костер",
    cafe: "Кафе",
    wind: "Ветер",
    forest: "Лес",
  },
};

let currentLang = localStorage.getItem("yecci_lang") || "en";

const soundConfig = [
  {
    id: "rain",
    name: "Rain",
    icon: "🌧️",
    src: "assets/rain.mp3",
    visualType: "rain",
    bgImage: "assets/rain_bg.jpg",
  },
  {
    id: "fire",
    name: "Fire",
    icon: "🔥",
    src: "assets/fire.mp3",
    visualType: "fire",
    bgImage: "assets/fire_bg.jpg",
  },
  {
    id: "cafe",
    name: "Cafe",
    icon: "☕",
    src: "assets/cafe.mp3",
    visualType: "cafe",
    bgImage: "assets/cafe_bg.jpg",
  },
  {
    id: "wind",
    name: "Wind",
    icon: "🍃",
    src: "assets/wind.mp3",
    visualType: "wind",
    bgImage: "assets/wind_bg.jpg",
  },
  {
    id: "forest",
    name: "Forest",
    icon: "🌲",
    src: "assets/forest.mp3",
    visualType: "forest",
    bgImage: "assets/forest_bg.jpg",
  },
];

const audioInstances = {};
let activeSoundsStack = [];
const dockContainer = document.getElementById("sound-dock");

function preloadImages() {
  soundConfig.forEach((sound) => {
    const img = new Image();
    img.src = sound.bgImage;
  });
}

function init() {
  preloadImages();
  startClock();
  updateLanguage(currentLang);

  soundConfig.forEach((sound) => {
    const card = document.createElement("div");
    card.classList.add("sound-card");
    card.id = `card-${sound.id}`;

    const btn = document.createElement("div");
    btn.classList.add("icon-btn");
    btn.textContent = sound.icon;
    btn.onclick = () => toggleSound(sound.id);

    const label = document.createElement("span");
    label.id = `label-${sound.id}`;
    label.textContent = sound.name;

    const volumeSlider = document.createElement("input");
    volumeSlider.type = "range";
    volumeSlider.min = "0";
    volumeSlider.max = "1";
    volumeSlider.step = "0.01";
    volumeSlider.value = "0.5";
    updateSliderBackground(volumeSlider);

    volumeSlider.onclick = (e) => e.stopPropagation();
    volumeSlider.oninput = (e) => {
      changeVolume(sound.id, e.target.value);
      updateSliderBackground(e.target);
    };

    const audio = new Audio(sound.src);
    audio.loop = true;
    audio.volume = 0.5;
    audioInstances[sound.id] = {
      element: audio,
      visualType: sound.visualType,
      active: false,
    };

    card.appendChild(btn);
    card.appendChild(label);
    card.appendChild(volumeSlider);
    dockContainer.appendChild(card);
  });

  updateSoundLabels();
}

function toggleLanguage() {
  currentLang = currentLang === "en" ? "ru" : "en";
  localStorage.setItem("yecci_lang", currentLang);
  updateLanguage(currentLang);
}

function updateLanguage(lang) {
  document.getElementById("lang-btn").textContent = lang.toUpperCase();

  const elements = document.querySelectorAll("[data-i18n]");
  elements.forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  const input = document.getElementById("focus-input");
  if (input) input.placeholder = translations[lang].input_placeholder;

  updateDynamicTexts(lang);
  updateSoundLabels();
}

function updateDynamicTexts(lang) {
  const t = translations[lang];

  if (isRunning) {
    startBtn.textContent = t.pause;
  } else {
    startBtn.textContent = t.start;
  }

  if (
    !isRunning &&
    timeLeft ===
      (currentMode === "focus" ? focusInput.value : breakInput.value) * 60
  ) {
    modeLabel.textContent = currentMode === "focus" ? t.ready : t.ready;
  } else {
    modeLabel.textContent =
      currentMode === "focus" ? t.focus_active : t.break_active;
  }

  const tickSpan = document.querySelector("#tick-toggle span");
  if (tickSpan) {
    tickSpan.textContent = tickingActive ? t.ticking : t.tick;
  }
}

function updateSoundLabels() {
  soundConfig.forEach((sound) => {
    const label = document.getElementById(`label-${sound.id}`);
    if (label) label.textContent = translations[currentLang][sound.id];
  });
}

function updateSliderBackground(slider) {
  const value = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
  slider.style.background = `linear-gradient(to right, var(--accent) 0%, var(--accent) ${value}%, rgba(255,255,255,0.2) ${value}%, rgba(255,255,255,0.2) 100%)`;
}

function toggleSound(id) {
  const soundObj = audioInstances[id];
  const card = document.getElementById(`card-${id}`);

  if (soundObj.active) {
    soundObj.element.pause();
    soundObj.active = false;
    card.classList.remove("active");
    toggleVisual(soundObj.visualType, false);
    activeSoundsStack = activeSoundsStack.filter((item) => item !== id);
  } else {
    soundObj.element.play().catch((e) => console.error(e));
    soundObj.active = true;
    card.classList.add("active");
    toggleVisual(soundObj.visualType, true);
    activeSoundsStack.push(id);
  }
  updateBackground();
}

function updateBackground() {
  if (activeSoundsStack.length > 0) {
    const lastActiveId = activeSoundsStack[activeSoundsStack.length - 1];
    const config = soundConfig.find((s) => s.id === lastActiveId);
    document.body.style.backgroundImage = `url('${config.bgImage}')`;
  } else {
    document.body.style.backgroundImage = "none";
  }
}

function changeVolume(id, value) {
  if (audioInstances[id]) audioInstances[id].element.volume = value;
}

let rainInterval, forestInterval, cafeInterval, fireInterval;

function toggleVisual(type, isActive) {
  switch (type) {
    case "rain":
      handleRain(isActive);
      break;
    case "fire":
      const fireContainer = document.getElementById("fire-container");
      if (fireContainer)
        isActive
          ? fireContainer.classList.add("active")
          : fireContainer.classList.remove("active");
      handleFireSparks(isActive);
      break;
    case "wind":
      const wind = document.getElementById("wind-overlay");
      if (wind)
        isActive
          ? wind.classList.add("active")
          : wind.classList.remove("active");
      break;
    case "forest":
      handleForest(isActive);
      break;
    case "cafe":
      handleCafe(isActive);
      break;
  }
}

function handleFireSparks(isActive) {
  const container = document.getElementById("fire-container");
  if (!container) return;
  if (isActive) {
    clearInterval(fireInterval);
    fireInterval = setInterval(() => {
      const spark = document.createElement("div");
      spark.classList.add("spark");
      spark.style.left = Math.random() * 100 + "vw";
      spark.style.animationDuration = Math.random() * 1 + 1.5 + "s";
      spark.style.setProperty("--rnd", Math.random());
      container.appendChild(spark);
      setTimeout(() => spark.remove(), 2500);
    }, 80);
  } else {
    clearInterval(fireInterval);
    container.innerHTML = "";
  }
}

function handleRain(isActive) {
  const container = document.getElementById("rain-container");
  if (!container) return;
  if (isActive) {
    rainInterval = setInterval(() => {
      const drop = document.createElement("div");
      drop.classList.add("rain-drop");
      drop.style.left = Math.random() * 100 + "vw";
      drop.style.animationDuration = Math.random() * 1 + 0.5 + "s";
      drop.style.opacity = Math.random();
      container.appendChild(drop);
      setTimeout(() => drop.remove(), 1500);
    }, 50);
  } else {
    clearInterval(rainInterval);
    container.innerHTML = "";
  }
}

function handleForest(isActive) {
  const container = document.getElementById("forest-container");
  if (!container) return;
  if (isActive) {
    forestInterval = setInterval(() => {
      const leaf = document.createElement("div");
      leaf.classList.add("leaf");
      const shapes = ["🍃", "🍂", "🍁"];
      leaf.textContent = shapes[Math.floor(Math.random() * shapes.length)];
      leaf.style.left = Math.random() * 100 + "vw";
      leaf.style.animationDuration = Math.random() * 5 + 5 + "s";
      container.appendChild(leaf);
      setTimeout(() => leaf.remove(), 10000);
    }, 800);
  } else {
    clearInterval(forestInterval);
    container.innerHTML = "";
  }
}

function handleCafe(isActive) {
  const container = document.getElementById("cafe-container");
  if (!container) return;
  if (isActive) {
    cafeInterval = setInterval(() => {
      const steam = document.createElement("div");
      steam.classList.add("steam");
      steam.style.left = Math.random() * 100 + "vw";
      steam.style.animationDuration = Math.random() * 4 + 4 + "s";
      container.appendChild(steam);
      setTimeout(() => steam.remove(), 8000);
    }, 1000);
  } else {
    clearInterval(cafeInterval);
    container.innerHTML = "";
  }
}

let timerInterval;
let timeLeft = 25 * 60;
let isRunning = false;
let currentMode = "focus";
let tickingActive = false;

const tickSound = new Audio("assets/ticking_clock.mp3");
const gongSound = new Audio("assets/timeout.mp3");

const timerDisplay = document.getElementById("timer-display");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const focusInput = document.getElementById("focus-duration");
const breakInput = document.getElementById("break-duration");
const modeLabel = document.getElementById("mode-label");
const tickBtn = document.getElementById("tick-toggle");

function updateTimerDisplay() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const timeString = `${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
  timerDisplay.textContent = timeString;
  const t = translations[currentLang];
  document.title = isRunning
    ? `${timeString} - ${t.focus_active}`
    : "Yecci Focus";
}

function toggleTimer() {
  const t = translations[currentLang];
  if (isRunning) {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.textContent = t.start;
    startBtn.style.background = "#fff";
    startBtn.style.color = "#1a1a2e";
    tickSound.pause();
    tickSound.currentTime = 0;
  } else {
    isRunning = true;
    startBtn.textContent = t.pause;
    startBtn.style.background = "var(--accent)";
    startBtn.style.color = "#fff";

    timerInterval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay();
        if (tickingActive) {
          tickSound.currentTime = 0;
          tickSound.play().catch((e) => {});
        }
      } else {
        clearInterval(timerInterval);
        isRunning = false;
        handleTimerComplete();
      }
    }, 1000);
  }
}

function toggleTicking() {
  const t = translations[currentLang];
  tickingActive = !tickingActive;
  const span = document.querySelector("#tick-toggle span");

  if (tickingActive) {
    span.textContent = t.ticking;
    tickBtn.classList.add("active");
    tickSound.currentTime = 0;
    tickSound.play().catch((e) => {});
  } else {
    span.textContent = t.tick;
    tickBtn.classList.remove("active");
    tickSound.pause();
    tickSound.currentTime = 0;
  }
}

function handleTimerComplete() {
  gongSound.currentTime = 0;
  gongSound.play().catch((e) => {});
  const t = translations[currentLang];

  if (currentMode === "focus") {
    setMode("break");
    modeLabel.textContent = t.break_auto;
    toggleTimer();
  } else {
    setMode("focus");
    modeLabel.textContent = t.focus_ready;
    startBtn.textContent = t.start;
    startBtn.style.background = "#fff";
    startBtn.style.color = "#1a1a2e";
  }
}

function setMode(mode) {
  currentMode = mode;
  const t = translations[currentLang];
  modeLabel.textContent = mode === "focus" ? t.focus_active : t.break_active;
  modeLabel.style.color = mode === "focus" ? "var(--accent)" : "#4cd137";

  const minutes = mode === "focus" ? focusInput.value : breakInput.value;
  timeLeft = minutes * 60;
  updateTimerDisplay();
}

function resetTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  const t = translations[currentLang];
  startBtn.textContent = t.start;
  startBtn.style.background = "#fff";
  startBtn.style.color = "#1a1a2e";
  tickSound.pause();
  tickSound.currentTime = 0;
  setMode(currentMode);
}

focusInput.addEventListener("change", () => {
  if (!isRunning && currentMode === "focus") setMode("focus");
});
breakInput.addEventListener("change", () => {
  if (!isRunning && currentMode === "break") setMode("break");
});

startBtn.addEventListener("click", toggleTimer);
resetBtn.addEventListener("click", resetTimer);

function startClock() {
  setInterval(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    document.getElementById("mini-clock").textContent = timeStr;
    document.getElementById("big-clock-display").textContent = timeStr;

    const options = { weekday: "long", day: "numeric", month: "short" };
    document.getElementById("date-display").textContent =
      now.toLocaleDateString(currentLang === "ru" ? "ru-RU" : "en-US", options);
  }, 1000);
}

window.switchView = function (viewName) {
  const timerDiv = document.getElementById("view-timer");
  const clockDiv = document.getElementById("view-clock");
  const btns = document.querySelectorAll(".view-btn");

  btns.forEach((btn) => btn.classList.remove("active"));

  const activeBtn = Array.from(btns).find(
    (b) =>
      b.getAttribute("data-i18n") ===
      (viewName === "timer" ? "pomodoro" : "clock_view")
  );
  if (activeBtn) activeBtn.classList.add("active");

  if (viewName === "timer") {
    timerDiv.style.display = "block";
    clockDiv.style.display = "none";
  } else {
    timerDiv.style.display = "none";
    clockDiv.style.display = "block";
  }
};

init();
