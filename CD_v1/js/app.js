const STORAGE_KEY = "cozydaily-v1-data";
const THEME_KEY = "cozydaily-v1-theme";

const defaultData = {
  tasks: [
    { id: 1, title: "Make my bed", category: "Personal", done: true },
    { id: 2, title: "Drink some water", category: "Self-care", done: true },
    { id: 3, title: "Review today's notes", category: "Study", done: false },
    { id: 4, title: "Take a little walk", category: "Personal", done: false }
  ],
  habits: [
    { id: 1, title: "Drink water", emoji: "💧", done: true },
    { id: 2, title: "Read 10 pages", emoji: "📖", done: false },
    { id: 3, title: "Stretch for 5 minutes", emoji: "🧘", done: false }
  ],
  journal: { title: "", content: "", mood: "Calm" }
};

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...structuredClone(defaultData), ...JSON.parse(saved) } : structuredClone(defaultData);
  } catch {
    return structuredClone(defaultData);
  }
}
let data = loadData();

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

// Theme: light, dark, or system.
function systemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function applyTheme(choice) {
  const actual = choice === "system" ? systemTheme() : choice;
  document.documentElement.dataset.theme = actual;
  $("#themeIcon").textContent = actual === "dark" ? "☀" : "☾";
  $("#themeToggle").setAttribute("aria-label", actual === "dark" ? "Switch to light mode" : "Switch to dark mode");
  $$(".theme-option").forEach(button => button.classList.toggle("selected", button.dataset.setTheme === choice));
}
let themeChoice = localStorage.getItem(THEME_KEY) || "light";
applyTheme(themeChoice);
$("#themeToggle").addEventListener("click", () => {
  themeChoice = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, themeChoice);
  applyTheme(themeChoice);
});
$$("[data-set-theme]").forEach(button => button.addEventListener("click", () => {
  themeChoice = button.dataset.setTheme;
  localStorage.setItem(THEME_KEY, themeChoice);
  applyTheme(themeChoice);
  showToast("Theme preference saved ♡");
}));
window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
  if (themeChoice === "system") applyTheme("system");
});

// Navigation between the simple app pages.
function openPage(name) {
  $$(".page").forEach(page => page.classList.toggle("active", page.id === `page-${name}`));
  $$(".nav-link[data-page]").forEach(button => button.classList.toggle("active", button.dataset.page === name));
  $("#pageName").textContent = name.charAt(0).toUpperCase() + name.slice(1);
  $("#sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
$$("[data-page]").forEach(button => button.addEventListener("click", () => openPage(button.dataset.page)));
$$("[data-go]").forEach(button => button.addEventListener("click", () => openPage(button.dataset.go)));
$("#mobileMenu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));

// Date labels.
const now = new Date();
$("#todayPill").textContent = now.toLocaleDateString(undefined, { month: "short", day: "numeric" });
$("#fullDate").textContent = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
$("#plannerDate").textContent = $("#todayPill").textContent;
$("#welcomeDate").textContent = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase();

// Tasks.
function renderTasks() {
  const list = $("#fullTaskList");
  list.innerHTML = "";
  data.tasks.forEach(task => {
    const li = document.createElement("li");
    li.className = "full-task";
    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "full-task-check";
    check.checked = task.done;
    check.setAttribute("aria-label", `Mark ${task.title} complete`);
    check.addEventListener("change", () => {
      task.done = check.checked;
      saveData(); renderTasks(); renderDashboard();
    });
    const name = document.createElement("span");
    name.className = `task-name${task.done ? " done" : ""}`;
    name.textContent = task.title;
    const category = document.createElement("span");
    category.className = "task-category";
    category.textContent = task.category;
    const remove = document.createElement("button");
    remove.className = "delete-task";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Delete ${task.title}`);
    remove.addEventListener("click", () => {
      data.tasks = data.tasks.filter(item => item.id !== task.id);
      saveData(); renderTasks(); renderDashboard(); showToast("Task removed");
    });
    li.append(check, name, category, remove);
    list.append(li);
  });
  const completed = data.tasks.filter(task => task.done).length;
  $("#taskSummary").textContent = `${completed} of ${data.tasks.length} tasks completed`;
  $("#taskEmpty").hidden = data.tasks.length > 0;
  list.hidden = data.tasks.length === 0;
}
$("#taskForm").addEventListener("submit", event => {
  event.preventDefault();
  const input = $("#taskInput");
  const title = input.value.trim();
  if (!title) return;
  data.tasks.push({ id: Date.now(), title, category: $("#taskCategory").value, done: false });
  input.value = "";
  saveData(); renderTasks(); renderDashboard(); showToast("A new task has been added ♡");
});
$("#clearCompleted").addEventListener("click", () => {
  data.tasks = data.tasks.filter(task => !task.done);
  saveData(); renderTasks(); renderDashboard(); showToast("Completed tasks cleared");
});

// Habits.
function renderHabits() {
  const list = $("#habitList");
  list.innerHTML = "";
  data.habits.forEach(habit => {
    const row = document.createElement("div");
    row.className = "habit-row";
    const check = document.createElement("input");
    check.type = "checkbox"; check.checked = habit.done;
    check.setAttribute("aria-label", `Mark ${habit.title} complete`);
    check.addEventListener("change", () => {
      habit.done = check.checked; saveData(); renderHabits(); renderDashboard();
    });
    const emoji = document.createElement("span"); emoji.textContent = habit.emoji;
    const title = document.createElement("span");
    title.textContent = habit.title;
    if (habit.done) title.classList.add("habit-done");
    const remove = document.createElement("button");
    remove.className = "habit-delete"; remove.type = "button"; remove.textContent = "×";
    remove.setAttribute("aria-label", `Delete ${habit.title}`);
    remove.addEventListener("click", () => {
      data.habits = data.habits.filter(item => item.id !== habit.id);
      saveData(); renderHabits(); renderDashboard(); showToast("Habit removed");
    });
    row.append(check, emoji, title, remove); list.append(row);
  });
  const done = data.habits.filter(habit => habit.done).length;
  $("#habitCount").textContent = `${done} of ${data.habits.length} habits completed`;
}
$("#habitForm").addEventListener("submit", event => {
  event.preventDefault();
  const input = $("#habitInput");
  const title = input.value.trim();
  if (!title) return;
  data.habits.push({ id: Date.now(), title, emoji: "🌱", done: false });
  input.value = ""; saveData(); renderHabits(); renderDashboard(); showToast("A new habit is ready to grow 🌱");
});

// Dashboard widgets.
function renderDashboard() {
  const total = data.tasks.length;
  const done = data.tasks.filter(task => task.done).length;
  const percent = total ? Math.round(done / total * 100) : 0;
  $("#dashTaskCount").textContent = `${done}/${total}`;
  $("#dashProgressPercent").textContent = `${percent}%`;
  $("#dashProgressBar").style.width = `${percent}%`;
  $("#dashProgressCircle").style.setProperty("--percent", `${percent}%`);
  $("#dashProgressCircle").setAttribute("aria-label", `${percent}% complete`);

  const taskContainer = $("#dashboardTasks");
  taskContainer.innerHTML = "";
  data.tasks.slice(0, 4).forEach(task => {
    const li = document.createElement("li"); li.className = "mini-task";
    const check = document.createElement("input"); check.type = "checkbox"; check.checked = task.done;
    check.addEventListener("change", () => { task.done = check.checked; saveData(); renderTasks(); renderDashboard(); });
    const title = document.createElement("span"); title.textContent = task.title;
    if (task.done) title.classList.add("done");
    const category = document.createElement("span"); category.className = "task-category"; category.textContent = task.category;
    li.append(check, title, category); taskContainer.append(li);
  });
  if (!data.tasks.length) taskContainer.innerHTML = '<li class="muted">No tasks yet. Enjoy the quiet or add one.</li>';

  const habitContainer = $("#dashboardHabits");
  habitContainer.innerHTML = "";
  data.habits.slice(0, 3).forEach(habit => {
    const row = document.createElement("div"); row.className = "mini-habit";
    const emoji = document.createElement("span"); emoji.className = "habit-emoji"; emoji.textContent = habit.emoji;
    const title = document.createElement("span"); title.textContent = habit.title;
    const status = document.createElement("span"); status.className = "habit-status"; status.textContent = habit.done ? "✓" : "○";
    row.append(emoji, title, status); habitContainer.append(row);
  });
  if (!data.habits.length) habitContainer.innerHTML = "<p class=\"muted\">Add a habit when you're ready.</p>";
}

// Journal.
let selectedMood = data.journal.mood || "Calm";
$("#journalTitle").value = data.journal.title || "";
$("#journalContent").value = data.journal.content || "";
$$(".mood-button").forEach(button => {
  button.classList.toggle("selected", button.dataset.mood === selectedMood);
  button.addEventListener("click", () => {
    selectedMood = button.dataset.mood;
    $$(".mood-button").forEach(item => item.classList.toggle("selected", item === button));
  });
});
$("#saveJournal").addEventListener("click", () => {
  data.journal = { title: $("#journalTitle").value.trim(), content: $("#journalContent").value, mood: selectedMood };
  saveData(); $("#journalStatus").textContent = "Saved just now on this device ♡"; showToast("Your journal entry is saved");
});

// Reset the sample data.
$("#resetData").addEventListener("click", () => {
  if (!window.confirm("Reset your CozyDaily demo tasks, habits and journal entry?")) return;
  data = structuredClone(defaultData);
  saveData();
  $("#journalTitle").value = ""; $("#journalContent").value = ""; selectedMood = "Calm";
  $$(".mood-button").forEach(button => button.classList.toggle("selected", button.dataset.mood === selectedMood));
  renderAll(); showToast("Demo data has been reset");
});

function renderAll() { renderTasks(); renderHabits(); renderDashboard(); }
renderAll();
