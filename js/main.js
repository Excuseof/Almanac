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
    setDoc,
    getDoc,
    updateDoc,
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

const CLOUD_NAME = "dbchhfvai";
const UPLOAD_PRESET = "almanac_unsigned";

const authBox = document.querySelector("#authBox");
const userBox = document.querySelector("#userBox");
const userEmail = document.querySelector("#userEmail");

const loginForm = document.querySelector("#loginForm");
const signupForm = document.querySelector("#signupForm");

const loginEmailInput = document.querySelector("#loginEmailInput");
const loginPasswordInput = document.querySelector("#loginPasswordInput");

const signupEmailInput = document.querySelector("#signupEmailInput");
const signupPasswordInput = document.querySelector("#signupPasswordInput");
const passwordConfirmInput = document.querySelector("#passwordConfirmInput");
const displayNameInput = document.querySelector("#displayNameInput");

const loginBtn = document.querySelector("#loginBtn");
const signupBtn = document.querySelector("#signupBtn");
const logoutBtn = document.querySelector("#logoutBtn");
const showSignupBtn = document.querySelector("#showSignupBtn");
const showLoginBtn = document.querySelector("#showLoginBtn");

const feedView = document.querySelector("#feedView");
const archiveView = document.querySelector("#archiveView");
const profileView = document.querySelector("#profileView");
const profileEntryCount = document.querySelector("#profileEntryCount");
const profileCategoryCount = document.querySelector("#profileCategoryCount");

const calendar = document.querySelector("#calendar");
const archiveTitle = document.querySelector("#archiveTitle");

const archiveTab = document.querySelector("#archiveTab");
const feedTab = document.querySelector("#feedTab");
const myTab = document.querySelector("#myTab");
const profileTab = document.querySelector("#profileTab");

const prevMonthBtn = document.querySelector("#prevMonthBtn");
const nextMonthBtn = document.querySelector("#nextMonthBtn");

const profileEmail = document.querySelector("#profileEmail");
const profileNameInput = document.querySelector("#profileNameInput");
const saveProfileBtn = document.querySelector("#saveProfileBtn");

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
let currentUserProfile = null;
let currentView = "discovery";
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

async function loadUserProfile(user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (userDoc.exists()) {
        currentUserProfile = userDoc.data();
    } else {
        currentUserProfile = {
            displayName: user.email,
            email: user.email
        };

        await setDoc(doc(db, "users", user.uid), currentUserProfile);
    }

    userEmail.textContent = `${currentUserProfile.displayName}'s Almanac`;
    profileEmail.textContent = currentUserProfile.email;
    profileNameInput.value = currentUserProfile.displayName;
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
    updateProfileStats();
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

        <div class="entry-author" onclick="viewAuthor('${entry.userId}', '${entry.displayName || entry.userEmail}')">
          ${entry.displayName || entry.userEmail}
        </div>

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

function clearViews() {
    feedView.style.display = "none";
    archiveView.classList.remove("active");
    profileView.classList.remove("active");

    archiveTab.classList.remove("active-tab");
    feedTab.classList.remove("active-tab");
    myTab.classList.remove("active-tab");
    profileTab.classList.remove("active-tab");
}

function showFeed() {
    clearViews();

    feedView.style.display = "block";

    if (currentView === "mine") {
        myTab.classList.add("active-tab");
    } else {
        feedTab.classList.add("active-tab");
    }
}

function showArchive() {
    clearViews();

    archiveView.classList.add("active");
    archiveTab.classList.add("active-tab");

    renderCalendar();
}

function updateProfileStats() {

    if (!currentUser) return;

    const myEntries =
        entries.filter(
            entry => entry.userId === currentUser.uid
        );

    const categories =
        new Set(
            myEntries.map(
                entry => entry.category
            )
        );

    profileEntryCount.textContent =
        myEntries.length;

    profileCategoryCount.textContent =
        categories.size;
}

function showProfile() {
    feedView.style.display = "none";
    archiveView.classList.remove("active");

    profileView.style.display = "block";
    profileView.classList.add("active");

    archiveTab.classList.remove("active-tab");
    feedTab.classList.remove("active-tab");
    myTab.classList.remove("active-tab");
    profileTab.classList.add("active-tab");

    updateProfileStats();
}

profileTab.addEventListener("click", () => {
    if (!currentUser) {
        alert("Please log in first.");
        return;
    }

    showProfile();
});

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

window.viewAuthor = function (userId, name) {
    selectedAuthorId = userId;
    currentView = "author";

    document.querySelector(".app-header p").textContent = `${name}'s Almanac`;

    showFeed();
    renderFeed();
    renderCalendar();
};

showSignupBtn.addEventListener("click", () => {
    loginForm.style.display = "none";
    signupForm.style.display = "block";
});

showLoginBtn.addEventListener("click", () => {
    signupForm.style.display = "none";
    loginForm.style.display = "block";
});

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
            displayName: currentUserProfile?.displayName || currentUser.email,
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

archiveTab.addEventListener("click", () => {
    showArchive();
});

feedTab.addEventListener("click", () => {
    currentView = "discovery";
    selectedAuthorId = null;

    document.querySelector(".app-header p").textContent = "Collected over time.";

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
    document.querySelector(".app-header p").textContent = "Collected over time.";

    showFeed();
    renderFeed();
    renderCalendar();
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
    if (!displayNameInput.value) {
        alert("Username is required.");
        return;
    }

    if (signupPasswordInput.value !== passwordConfirmInput.value) {
        alert("Passwords do not match.");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            signupEmailInput.value,
            signupPasswordInput.value
        );

        await setDoc(doc(db, "users", userCredential.user.uid), {
            displayName: displayNameInput.value,
            email: signupEmailInput.value,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        alert(error.message);
    }
});

loginBtn.addEventListener("click", async () => {
    try {
        await signInWithEmailAndPassword(
            auth,
            loginEmailInput.value,
            loginPasswordInput.value
        );
    } catch (error) {
        alert(error.message);
    }
});

logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
});

saveProfileBtn.addEventListener("click", async () => {
    if (!currentUser) return;

    await updateDoc(doc(db, "users", currentUser.uid), {
        displayName: profileNameInput.value
    });

    await loadUserProfile(currentUser);

    alert("Profile updated.");
});

onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (user) {
        authBox.style.display = "none";
        userBox.style.display = "flex";

        await loadUserProfile(user);

        currentView = "mine";
        selectedAuthorId = null;

        await loadEntries();
        showArchive();
    } else {
        authBox.style.display = "flex";
        userBox.style.display = "none";
        userEmail.textContent = "";
        currentUserProfile = null;

        await loadEntries();
        showFeed();
    }
});