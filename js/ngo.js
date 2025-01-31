import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, collection, getDocs, updateDoc, doc, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM elements
const donationList = document.getElementById("donation-list");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const requestFoodBtn = document.getElementById("request-donations-btn");
const modal = document.getElementById("donation-modal");
const modalContent = document.getElementById("modal-content");
const logoutBtn = document.getElementById("logout-btn");

let currentDonationId = null;

document.addEventListener("DOMContentLoaded", () => {
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            signOut(auth).then(() => {
                window.location.href = "login.html";
            }).catch((error) => {
                alert(error.message);
            });
        });
    }

    if (searchButton && searchInput) {
        searchButton.addEventListener("click", () => {
            const searchQuery = searchInput.value.toLowerCase();
            loadDonations(searchQuery);
        });
    }

    if (requestFoodBtn) {
        requestFoodBtn.addEventListener("click", async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    alert("You must be logged in to request food.");
                    return;
                }

                await addDoc(collection(db, "food_requests"), {
                    ngoId: user.uid,
                    requestedAt: new Date(),
                    status: "pending"
                });

                alert("Food request submitted successfully!");
            } catch (error) {
                console.error("Error requesting food:", error);
                alert("Error requesting food: " + error.message);
            }
        });
    }

    loadDonations();
});

// Load donations from "foods" collection
// Load donations from "foods" collection (Fix applied)
async function loadDonations(searchQuery = "") {
    const donationList = document.getElementById("donation-list");

    if (!donationList) {
        console.error("❌ ERROR: 'donation-list' element NOT found in the DOM.");
        return;
    }

    try {
        const donationsSnapshot = await getDocs(collection(db, "foods")); // ✅ Fetch from "foods" instead of "donations"
        donationList.innerHTML = "";  // Clear existing list

        donationsSnapshot.forEach((doc) => {
            const donationData = doc.data();
            const name = donationData.name?.toLowerCase() || "";
            const place = donationData.place?.toLowerCase() || "";
            const status = donationData.status || "Pending"; // Default status is "Pending"

            if (name.includes(searchQuery) || place.includes(searchQuery)) {
                const donationItem = document.createElement("li");
                donationItem.classList.add("donation-item");

                // Apply different styles based on status
                if (status === "accept") {
                    donationItem.classList.add("accepted");
                } else if (status === "decline") {
                    donationItem.classList.add("declined");
                }

                donationItem.innerHTML = `
                    <div>
                        <h4>${donationData.name}</h4>
                        <p>${donationData.description}</p>
                        <p>Location: ${donationData.place}</p>
                        <p>Quality: ${donationData.quality}</p>
                        <p>Servings: ${donationData.servings}</p>
                        <p>Longevity: ${donationData.longevity} hours</p>
                        <p class="donation-status">Status: <span>${status.toUpperCase()}</span></p>
                    </div>
                    ${status === "Pending" ? `
                        <button class="accept-btn" data-id="${doc.id}">Accept</button>
                        <button class="decline-btn" data-id="${doc.id}">Decline</button>
                    ` : ""}
                `;

                donationList.appendChild(donationItem);

                // Add event listeners for Accept/Decline buttons (only if status is "Pending")
                if (status === "Pending") {
                    const acceptButton = donationItem.querySelector(".accept-btn");
                    const declineButton = donationItem.querySelector(".decline-btn");

                    acceptButton.addEventListener("click", () => openModal(doc.id, "accept"));
                    declineButton.addEventListener("click", () => openModal(doc.id, "decline"));
                }
            }
        });
    } catch (error) {
        console.error("Error loading donations:", error);
        alert("Error loading donations: " + error.message);
    }
}



// Open modal for Accept/Decline confirmation
function openModal(donationId, action) {
    currentDonationId = donationId;
    modal.style.display = "flex";
    modalContent.innerHTML = `
        <h3>Are you sure you want to ${action} this donation?</h3>
        <button id="confirm-btn">${action === "accept" ? "Accept" : "Decline"}</button>
        <button id="close-modal-btn">Close</button>
    `;

    const confirmBtn = document.getElementById("confirm-btn");
    const closeModalBtn = document.getElementById("close-modal-btn");

    if (confirmBtn) {
        confirmBtn.addEventListener("click", () => handleDonationResponse(action));
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });
    }
}

// Accept or Decline donation
async function handleDonationResponse(response) {
    try {
        const donationDocRef = doc(db, "foods", currentDonationId);
        await updateDoc(donationDocRef, {
            status: response,
            ngoId: auth.currentUser.uid,
        });

        modal.style.display = "none";
        loadDonations();
    } catch (error) {
        alert("Error updating donation status: " + error.message);
    }
}
