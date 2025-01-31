import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js"; // Firebase configuration import
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM elements
const foodListing = document.getElementById("food-list");
const addFoodButton = document.getElementById("add-food-button");
const addFoodFormContainer = document.getElementById("add-food-form-container");
const addFoodForm = document.getElementById("add-food-form");
const foodNameInput = document.getElementById("food-name");
const foodQuantityInput = document.getElementById("food-quantity");
const foodDescriptionInput = document.getElementById("food-description");
const foodPlaceInput = document.getElementById("food-place");
const foodCookingTimeInput = document.getElementById("food-cooking-time");
const foodServingsInput = document.getElementById("food-servings");
const foodQualityInput = document.getElementById("food-quality");
const foodLongevityInput = document.getElementById("food-longevity");
const logoutButton = document.getElementById("logout-btn");
const loadingSpinner = document.getElementById("loading-spinner");

// Wait for DOM to be fully loaded before adding event listeners
document.addEventListener("DOMContentLoaded", () => {
    // Show and hide add food form
    addFoodButton.addEventListener("click", () => {
        addFoodFormContainer.style.display = "block"; // Show the form
    });

    // Handle add food form submission
    addFoodForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = foodNameInput.value;
        const quantity = foodQuantityInput.value;
        const description = foodDescriptionInput.value;
        const place = foodPlaceInput.value;
        const cookingTime = foodCookingTimeInput.value;
        const servings = foodServingsInput.value;
        const quality = foodQualityInput.value;
        const longevity = foodLongevityInput.value;

        if (name && quantity && description && place && cookingTime && servings && quality && longevity) {
            showLoading(true);

            try {
                // Add food to Firestore
                await addDoc(collection(db, "foods"), {
                    name,
                    quantity,
                    description,
                    place,
                    cookingTime,
                    servings,
                    quality,
                    longevity,
                    restaurantId: auth.currentUser.uid, // Associate food with restaurant
                    createdAt: new Date()
                });

                // Clear the form
                foodNameInput.value = "";
                foodQuantityInput.value = "";
                foodDescriptionInput.value = "";
                foodPlaceInput.value = "";
                foodCookingTimeInput.value = "";
                foodServingsInput.value = "";
                foodQualityInput.value = "Excellent"; // Reset to default value
                foodLongevityInput.value = "";

                // Hide the form and refresh the food list
                addFoodFormContainer.style.display = "none";
                loadFoodItems();
            } catch (error) {
                alert("Error adding food: " + error.message);
            } finally {
                showLoading(false);
            }
        } else {
            alert("Please fill all fields!");
        }
    });

    // Logout functionality
    logoutButton.addEventListener("click", () => {
        signOut(auth)
            .then(() => {
                window.location.href = "login.html"; // Redirect to login after logout
            })
            .catch((error) => alert("Logout error: " + error.message));
    });

    // Load food items initially
    loadFoodItems();
});

// Function to load food items
async function loadFoodItems() {
    showLoading(true);

    try {
        // Get food items from Firestore where restaurantId matches current user's UID
        const querySnapshot = await getDocs(collection(db, "foods"));
        foodListing.innerHTML = ""; // Clear the current list before reloading

        querySnapshot.forEach((doc) => {
            const foodData = doc.data();
            if (foodData.restaurantId === auth.currentUser.uid) {
                // Create list item for each food
                const foodItem = document.createElement("li");
                foodItem.classList.add("food-item");
                foodItem.innerHTML = `
                    <div>
                        <h4>${foodData.name}</h4>
                        <p>${foodData.description}</p>
                        <small>Quantity: ${foodData.quantity}</small>
                        <small>Place: ${foodData.place}</small>
                        <small>Cooking Time: ${foodData.cookingTime}</small>
                        <small>Servings: ${foodData.servings}</small>
                        <small>Quality: ${foodData.quality}</small>
                        <small>Longevity: ${foodData.longevity} hours</small>
                    </div>
                    <button class="delete-btn" data-id="${doc.id}">Delete</button>
                `;
                foodListing.appendChild(foodItem);

                // Delete food functionality
                foodItem.querySelector(".delete-btn").addEventListener("click", () => {
                    deleteFood(doc.id);
                });
            }
        });
    } catch (error) {
        alert("Error loading food items: " + error.message);
    } finally {
        showLoading(false);
    }
}

// Function to delete food item
async function deleteFood(foodId) {
    showLoading(true);

    try {
        // Delete the food item from Firestore
        await deleteDoc(doc(db, "foods", foodId));
        loadFoodItems(); // Reload food list after deletion
    } catch (error) {
        alert("Error deleting food: " + error.message);
    } finally {
        showLoading(false);
    }
}

// Function to show/hide loading spinner
function showLoading(isLoading) {
    if (isLoading) {
        loadingSpinner.style.display = "block";
    } else {
        loadingSpinner.style.display = "none";
    }
}

