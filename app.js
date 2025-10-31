
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js");
  });
}

let deferredPrompt;
const btnInstall = document.getElementById("btnInstall");
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  btnInstall.hidden = false;
});
btnInstall?.addEventListener("click", async () => {
  btnInstall.hidden = true;
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  }
});

const $ = (sel) => document.querySelector(sel);
const pad = (n, w = 2) => String(n).padStart(w, "0");
const toMS = (mmss) => {
  const m = mmss.match(/^(\d{1,3}):([0-5]?\d)$/);
  if (!m) return null;
  return (parseInt(m[1], 10) * 60 + parseInt(m[2], 10)) * 1000;
};
const fromMSmmss = (ms) => {
  ms = Math.max(0, ms);
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${pad(m)}:${pad(s)}`;
};
const fromMSmmsscc = (ms) => {
  ms = Math.max(0, ms);
  const cc = Math.floor((ms % 1000) / 10);
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${pad(m)}:${pad(s)}.${pad(cc)}`;
};

// --- Live clock (Europe/Paris) ---
const clockTime = $("#clockTime");
const clockDate = $("#clockDate");
function tickClock() {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Europe/Paris",
    hour12: false,
  });
  const dfmt = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Paris",
  });
  clockTime.textContent = fmt.format(now);
  clockDate.textContent = dfmt.format(now);
}
setInterval(tickClock, 250);
tickClock();

document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".tab")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const name = btn.dataset.tab;
    document
      .querySelectorAll(".tabpane")
      .forEach((p) => p.classList.remove("show"));
    document.getElementById("tab-" + name).classList.add("show");
  });
});

const timerInput = $("#timerInput");
const timerDisplay = $("#timerDisplay");
const timerToggle = $("#timerToggle");
const timerReset = $("#timerReset");
const timerAlert = $("#timerAlert");
const beep = $("#beep");

let timerRunning = false;
let timerEndAt = 0;
let timerRAF;

function updateTimerUI() {
  const remaining = Math.max(0, timerEndAt - performance.now());
  timerDisplay.textContent = fromMSmmss(remaining);
  if (remaining <= 0 && timerRunning) {
    timerRunning = false;
    cancelAnimationFrame(timerRAF);
    timerToggle.textContent = "Démarrer";
    timerAlert.hidden = false;
    try {
      beep.currentTime = 0;
      beep.play();
    } catch (e) {}
    if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
  } else {
    timerRAF = requestAnimationFrame(updateTimerUI);
  }
}

function setTimerFromInput() {
  const ms = toMS(timerInput.value.trim());
  if (ms == null) return;
  timerDisplay.textContent = fromMSmmss(ms);
}

["input", "change"].forEach((ev) =>
  timerInput.addEventListener(ev, setTimerFromInput)
);

function startTimer() {
  timerAlert.hidden = true;
  const ms = toMS(timerInput.value.trim());
  if (ms == null) {
    timerInput.focus();
    return;
  }
  timerEndAt = performance.now() + ms;
  timerRunning = true;
  timerToggle.textContent = "Stop";
  cancelAnimationFrame(timerRAF);
  timerRAF = requestAnimationFrame(updateTimerUI);
}
function stopTimer() {
  timerRunning = false;
  timerToggle.textContent = "Démarrer";
  cancelAnimationFrame(timerRAF);
}
timerToggle.addEventListener("click", () => {
  if (timerRunning) stopTimer();
  else startTimer();
});
timerReset.addEventListener("click", () => {
  stopTimer();
  timerAlert.hidden = true;
  setTimerFromInput();
});

const inc = (m = 0, s = 0) => {
  const ms0 = toMS(timerInput.value.trim()) ?? 0;
  let total = Math.max(0, ms0 / 1000 + m * 60 + s);
  const mm = Math.floor(total / 60);
  const ss = Math.floor(total % 60);
  timerInput.value = `${pad(mm)}:${pad(ss)}`;
  setTimerFromInput();
};
$("#incMin").onclick = () => inc(1, 0);
$("#decMin").onclick = () => inc(-1, 0);
$("#incSec").onclick = () => inc(0, 10);
$("#decSec").onclick = () => inc(0, -10);

const chronoDisplay = $("#chronoDisplay");
const chronoToggle = $("#chronoToggle");
const chronoLap = $("#chronoLap");
const chronoReset = $("#chronoReset");
const laps = $("#laps");

let chronoRunning = false;
let chronoStart = 0;
let chronoAccum = 0;
let chronoRAF;

function updateChrono() {
  const elapsed =
    chronoAccum + (chronoRunning ? performance.now() - chronoStart : 0);
  chronoDisplay.textContent = fromMSmmsscc(elapsed);
  chronoRAF = requestAnimationFrame(updateChrono);
}
updateChrono();

chronoToggle.addEventListener("click", () => {
  if (!chronoRunning) {
    chronoRunning = true;
    chronoStart = performance.now();
    chronoToggle.textContent = "Arrêter";
  } else {
    chronoAccum += performance.now() - chronoStart;
    chronoRunning = false;
    chronoToggle.textContent = "Lancer";
  }
});

chronoLap.addEventListener("click", () => {
  const elapsed =
    chronoAccum + (chronoRunning ? performance.now() - chronoStart : 0);
  const li = document.createElement("li");
  li.innerHTML = `<span>Tour</span><span class="badge">${fromMSmmsscc(
    elapsed
  )}</span>`;
  laps.prepend(li);
});

chronoReset.addEventListener("click", () => {
  chronoRunning = false;
  chronoAccum = 0;
  chronoToggle.textContent = "Lancer";
  laps.innerHTML = "";
});

const alarmForm = $("#alarmForm");
const alarmTime = $("#alarmTime");
const alarmMsg = $("#alarmMsg");
const alarmList = $("#alarms");
const alarmAlert = $("#alarmAlert");
const alarmAlertText = $("#alarmAlertText");

let alarms = JSON.parse(localStorage.getItem("oclock-alarms") || "[]");

function saveAlarms() {
  localStorage.setItem("oclock-alarms", JSON.stringify(alarms));
}

function hhmmToNextDate(hhmm) {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  const now = new Date();
  const tz = "Europe/Paris";
  const nowInTz = new Date(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(now)
  );
  let target = new Date(nowInTz);
  target.setHours(h, m, 0, 0);
  if (target <= nowInTz) target.setDate(target.getDate() + 1);
  return target;
}

function renderAlarms() {
  alarmList.innerHTML = "";
  const now = new Date();
  alarms.sort((a, b) => a.time.localeCompare(b.time));
  for (const a of alarms) {
    const next = hhmmToNextDate(a.time);
    const msDiff = next - now;
    const pastToday = new Date().toTimeString().slice(0, 5) > a.time;
    const status = pastToday
      ? "passée (rejouera demain)"
      : `dans ${humanize(msDiff)}`;
    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${a.time}</strong> — ${a.message || "Alarme"}
        <div class="muted"></div>
      </div>
      <div class="actions">
        <span class="tag">${status}</span>
        <button data-act="toggle">${
          a.enabled ? "Désactiver" : "Activer"
        }</button>
        <button data-act="delete" class="ghost">Supprimer</button>
      </div>`;
    li.dataset.id = a.id;
    alarmList.appendChild(li);
  }
}
function humanize(ms) {
  ms = Math.max(0, ms);
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    ss = s % 60;
  const parts = [];
  if (h) parts.push(`${h} h`);
  if (m) parts.push(`${m} min`);
  parts.push(`${ss} s`);
  return parts.join(" ");
}

alarmForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!alarmTime.value) return;
  const a = {
    id: crypto.randomUUID(),
    time: alarmTime.value,
    message: alarmMsg.value.trim(),
    enabled: true,
  };
  alarms.push(a);
  saveAlarms();
  renderAlarms();
  alarmForm.reset();
});

alarmList.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const id = e.target.closest("li").dataset.id;
  const a = alarms.find((x) => x.id === id);
  if (!a) return;
  const act = btn.dataset.act;
  if (act === "delete") {
    alarms = alarms.filter((x) => x.id !== id);
  }
  if (act === "toggle") {
    a.enabled = !a.enabled;
  }
  saveAlarms();
  renderAlarms();
});

function pollAlarms() {
  const now = new Date();
  const tzNow = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  for (const a of alarms) {
    if (!a.enabled) continue;
    if (tzNow === a.time) {
      a.enabled = false;
      saveAlarms();
      renderAlarms();
      alarmAlertText.textContent = a.message || `Alarme ${a.time}`;
      alarmAlert.hidden = false;
      try {
        beep.currentTime = 0;
        beep.play();
      } catch (e) {}
      if ("vibrate" in navigator) navigator.vibrate([250, 100, 250, 100, 400]);
      setTimeout(() => (alarmAlert.hidden = true), 60000);
    }
  }
}
setInterval(pollAlarms, 1000);
renderAlarms();
