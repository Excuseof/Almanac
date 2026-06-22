import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDyVei4WQWqxPggwvKDlVciz28Zyj35xcQ",
    authDomain: "almanac-a0352.firebaseapp.com",
    projectId: "almanac-a0352",
    storageBucket: "almanac-a0352.firebasestorage.app",
    messagingSenderId: "448289678386",
    appId: "1:448289678386:web:7b6d043ab71d50c7b0482b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const passwordConfirmInput = document.querySelector("#passwordConfirmInput");
const myTab = document.querySelector("#myTab");
const CLOUD_NAME = "dbchhfvai";
const UPLOAD_PRESET = "almanac_unsigned";

const authBox = document.querySelector("#authBox");
const userBox = document.querySelector("#userBox");
const emailInput = document.querySelector("#emailInput");
const passwordInput = document.querySelector("#passwordInput");
const signupBtn = document.querySelector("#signupBtn");
const loginBtn = document.querySelector("#loginBtn");
const logoutBtn = document.querySelector("#logoutBtn");
const userEmail = document.querySelector("#userEmail");

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

let entries = [];
let selectedFile = null;
let currentCategory = "All";
let currentUser = null;
let currentView = "public";
let selectedAuthorId = null;

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
    let filtered = entries;

    if (currentView === "mine" && currentUser) {
        filtered = filtered.filter(entry => entry.userId === currentUser.uid);
    }

    if (selectedAuthorId) {
        filtered = filtered.filter(entry => entry.userId === selectedAuthorId);
    }

    if (currentCategory !== "All") {
        filtered = filtered.filter(entry => entry.category === currentCategory);
    }

    return filtered;
}

async function uploadImageToCloudinary(file) {
    if (!file) return "";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "almanac");

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
            method: "POST",
            body: formData
        }
    );

    const data = await response.json();

    if (!data.secure_url) {
        throw new Error("Image upload failed.");
    }

    return data.secure_url;
}

async function loadEntries() {
    const q = query(collection(db, "entries"), orderBy("rawDate", "desc"));
    const snapshot = await getDocs(q);

    entries = snapshot.docs.map(document => {
        return {
            id: document.id,
            ...document.data()
        };
    });

    renderFeed();
    renderCalendar();
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
        const canDelete = currentUser && currentUser.uid === entry.userId;

        feedView.innerHTML += `
      <article class="entry">
        <div class="entry-top">
          <div class="entry-date">${entry.displayDate}</div>

          ${canDelete
                ? `<button class="delete-btn" onclick="deleteEntry('${entry.id}')">×</button>`
                : ""
            }
        </div>

        ${entry.photoUrl
                ? `<img src="${entry.photoUrl}" class="entry-image" alt="">`
                : ""
            }
        <div class="entry-author" onclick="viewAuthor('${entry.userId}', '${entry.userEmail}')">${entry.userEmail}</div>
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
                ? `<span class="day-count">${"●".repeat(dayEntries.length)}</span>`
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

    if (currentView === "mine") {
        myTab.classList.add("active-tab");
        feedTab.classList.remove("active-tab");
    } else {
        feedTab.classList.add("active-tab");
        myTab.classList.remove("active-tab");
    }

    archiveTab.classList.remove("active-tab");
}

function showArchive() {
    feedView.style.display = "none";
    archiveView.classList.add("active");

    archiveTab.classList.add("active-tab");
    feedTab.classList.remove("active-tab");
    myTab.classList.remove("active-tab");

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
    selectedFile = null;
}

window.deleteEntry = async function (id) {
    const ok = confirm("Delete this entry?");
    if (!ok) return;

    await deleteDoc(doc(db, "entries", id));

    await loadEntries();
};

photoInput.addEventListener("change", () => {
    const file = photoInput.files[0];

    if (!file) return;

    selectedFile = file;

    const previewUrl = URL.createObjectURL(file);
    photoPreview.src = previewUrl;
    photoPreview.style.display = "block";
});

addBtn.addEventListener("click", () => {
    if (!currentUser) {
        alert("Please log in first.");
        return;
    }

    modal.classList.add("active");
});

closeModalBtn.addEventListener("click", () => {
    modal.classList.remove("active");
});

saveBtn.addEventListener("click", async () => {
    if (!currentUser) {
        alert("Please log in first.");
        return;
    }

    const title = document.querySelector("#title").value;
    const description = document.querySelector("#description").value;
    const location = document.querySelector("#location").value;
    const category = document.querySelector("#category").value;

    if (!title || !description) {
        alert("Title and description are required.");
        return;
    }

    try {
        saveBtn.textContent = "Saving...";
        saveBtn.disabled = true;

        const photoUrl = await uploadImageToCloudinary(selectedFile);

        const now = new Date();

        await addDoc(collection(db, "entries"), {
            title,
            description,
            location,
            category,
            photoUrl,
            rawDate: now.toISOString(),
            displayDate: formatDate(now),
            userId: currentUser.uid,
            userEmail: currentUser.email,
            createdAt: serverTimestamp()
        });

        await loadEntries();

        resetForm();
        modal.classList.remove("active");
    } catch (error) {
        alert(error.message);
    } finally {
        saveBtn.textContent = "Save";
        saveBtn.disabled = false;
    }
});

feedTab.addEventListener("click", () => {
    currentView = "public";
    selectedAuthorId = null;
    feedTab.textContent = "Public";
    showFeed();
    renderFeed();
});

myTab.addEventListener("click", () => {
    if (!currentUser) {
        alert("Please log in first.");
        return;
    }
    currentView = "mine";
    selectedAuthorId = null;
    feedTab.textContent = "Public";

    showFeed();

    myTab.classList.add("active-tab");
    feedTab.classList.remove("active-tab");
    archiveTab.classList.remove("active-tab");

    renderFeed();
    renderCalendar();
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

signupBtn.addEventListener("click", async () => {
    if (passwordInput.value !== passwordConfirmInput.value) {
        alert("Passwords do not match.");
        return;
    }

    try {
        await createUserWithEmailAndPassword(
            auth,
            emailInput.value,
            passwordInput.value
        );
    } catch (error) {
        alert(error.message);
    }
});

loginBtn.addEventListener("click", async () => {
    try {
        await signInWithEmailAndPassword(
            auth,
            emailInput.value,
            passwordInput.value
        );
    } catch (error) {
        alert(error.message);
    }
});

logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (user) {
        authBox.style.display = "none";
        userBox.style.display = "flex";
        userEmail.textContent = user.email;
    } else {
        authBox.style.display = "flex";
        userBox.style.display = "none";
        userEmail.textContent = "";
    }

    await loadEntries();
});

window.viewAuthor = function (userId, email) {
    selectedAuthorId = userId;
    currentView = "author";

    feedTab.textContent = `${email}'s Almanac`;

    showFeed();
    renderFeed();
    renderCalendar();
};