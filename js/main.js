const feedView = document.querySelector("#feedView");
const archiveView = document.querySelector("#archiveView");
const calendar = document.querySelector("#calendar");
const archiveTitle = document.querySelector("#archiveTitle");

const feedTab = document.querySelector("#feedTab");
const archiveTab = document.querySelector("#archiveTab");

const prevMonthBtn = document.querySelector("#prevMonthBtn");
const nextMonthBtn = document.querySelector("#nextMonthBtn");

const addBtn = document.querySelector("#addBtn");
const modal = document.querySelector("#modal");
const saveBtn = document.querySelector("#saveBtn");
const closeModalBtn = document.querySelector("#closeModalBtn");

const photoInput = document.querySelector("#photoInput");
const photoPreview = document.querySelector("#photoPreview");

const categoryBtns = document.querySelectorAll(".category-btn");

let entries = JSON.parse(localStorage.getItem("entries")) || [];

function saveEntries() {
    localStorage.setItem("entries", JSON.stringify(entries));
}

entries = entries.map((entry) => {
    if (!entry.id) {
        return {
            ...entry,
            id: crypto.randomUUID()
        };
    }

    return entry;
});

saveEntries();

let selectedPhoto = "";
let currentCategory = "All";

const today = new Date();
let currentArchiveYear = today.getFullYear();
let currentArchiveMonth = today.getMonth();

function formatDate(date) {
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).toUpperCase();
}

function getFilteredEntries() {
    if (currentCategory === "All") {
        return entries;
    }

    return entries.filter(entry => entry.category === currentCategory);
}

function renderFeed(customEntries = null) {
    const filteredEntries = customEntries || getFilteredEntries();

    if (filteredEntries.length === 0) {
        feedView.innerHTML = `
      <div class="empty-state">
        <h2>No entries yet.</h2>
        <p>Start your first entry.</p>
      </div>
    `;
        return;
    }

    feedView.innerHTML = "";

    filteredEntries.forEach((entry) => {
        feedView.innerHTML += `
      <article class="entry">

        <div class="entry-top">
          <div class="entry-date">${entry.displayDate}</div>

          <button class="delete-btn" onclick="deleteEntry('${entry.id}')">
            ×
          </button>
        </div>

        ${entry.photo
                ? `<img src="${entry.photo}" class="entry-image" alt="">`
                : ""
            }

        <div class="entry-category">${entry.category}</div>

        <h2 class="entry-title">${entry.title}</h2>

        <p class="entry-description">${entry.description}</p>

        ${entry.location
                ? `<div class="entry-location">📍 ${entry.location}</div>`
                : ""
            }

      </article>
    `;
    });
}

function renderCalendar() {
    calendar.innerHTML = "";

    const monthName = new Date(
        currentArchiveYear,
        currentArchiveMonth
    ).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
    });

    archiveTitle.textContent = monthName;

    const firstDay = new Date(currentArchiveYear, currentArchiveMonth, 1).getDay();
    const daysInMonth = new Date(currentArchiveYear, currentArchiveMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const emptyBox = document.createElement("div");
        emptyBox.classList.add("day", "empty-day");
        calendar.appendChild(emptyBox);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayEntries = getFilteredEntries().filter((entry) => {
            const entryDate = new Date(entry.rawDate);

            return (
                entryDate.getFullYear() === currentArchiveYear &&
                entryDate.getMonth() === currentArchiveMonth &&
                entryDate.getDate() === day
            );
        });

        const dayBox = document.createElement("div");
        dayBox.classList.add("day");

        if (dayEntries.length > 0) {
            dayBox.classList.add("has-entry");
        }

        dayBox.innerHTML = `
      <span>${day}</span>
      ${dayEntries.length > 0
                ? `<span class="day-count">${"●".repeat(dayEntries.length)} </span>`
                : ""
            }
    `;

        dayBox.addEventListener("click", () => {
            if (dayEntries.length > 0) {
                showFeed();
                renderFeed(dayEntries);
            }
        });

        calendar.appendChild(dayBox);
    }
}

function showFeed() {
    feedView.style.display = "block";
    archiveView.classList.remove("active");

    feedTab.classList.add("active-tab");
    archiveTab.classList.remove("active-tab");
}

function showArchive() {
    feedView.style.display = "none";
    archiveView.classList.add("active");

    archiveTab.classList.add("active-tab");
    feedTab.classList.remove("active-tab");

    renderCalendar();
}

function resetForm() {
    document.querySelector("#title").value = "";
    document.querySelector("#description").value = "";
    document.querySelector("#location").value = "";
    document.querySelector("#category").value = "Away";

    photoInput.value = "";
    photoPreview.src = "";
    photoPreview.style.display = "none";
    selectedPhoto = "";
}

window.deleteEntry = function (id) {
    const ok = confirm("Delete this entry?");

    if (!ok) return;

    entries = entries.filter(entry => entry.id !== id);

    saveEntries();
    renderFeed();
    renderCalendar();
};

photoInput.addEventListener("change", () => {
    const file = photoInput.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        selectedPhoto = reader.result;
        photoPreview.src = selectedPhoto;
        photoPreview.style.display = "block";
    };

    reader.readAsDataURL(file);
});

addBtn.addEventListener("click", () => {
    modal.classList.add("active");
});

closeModalBtn.addEventListener("click", () => {
    modal.classList.remove("active");
});

saveBtn.addEventListener("click", () => {
    const title = document.querySelector("#title").value;
    const description = document.querySelector("#description").value;
    const location = document.querySelector("#location").value;
    const category = document.querySelector("#category").value;

    if (!title || !description) {
        alert("Title and description are required.");
        return;
    }

    const now = new Date();

    const newEntry = {
        id: crypto.randomUUID(),
        title,
        description,
        location,
        category,
        photo: selectedPhoto,
        rawDate: now.toISOString(),
        displayDate: formatDate(now)
    };

    entries.unshift(newEntry);

    saveEntries();
    renderFeed();
    renderCalendar();
    resetForm();

    modal.classList.remove("active");
});

feedTab.addEventListener("click", () => {
    showFeed();
    renderFeed();
});

archiveTab.addEventListener("click", () => {
    showArchive();
});

prevMonthBtn.addEventListener("click", () => {
    currentArchiveMonth--;

    if (currentArchiveMonth < 0) {
        currentArchiveMonth = 11;
        currentArchiveYear--;
    }

    renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
    currentArchiveMonth++;

    if (currentArchiveMonth > 11) {
        currentArchiveMonth = 0;
        currentArchiveYear++;
    }

    renderCalendar();
});

categoryBtns.forEach((button) => {
    button.addEventListener("click", () => {
        currentCategory = button.dataset.category;

        categoryBtns.forEach(btn => {
            btn.classList.remove("active-category");
        });

        button.classList.add("active-category");

        renderFeed();
        renderCalendar();
    });
});

renderFeed();
renderCalendar();