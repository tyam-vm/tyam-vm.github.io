import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js"; // Import Firestore modular functions
import { firebaseConfig } from "./firebase-config.js"; // Correct import

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore using the modular SDK

// Registration
document.getElementById("register-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // Save user role in Firestore
            return setDoc(doc(db, "users", user.uid), { email, role });
        })
        .then(() => {
            // After saving user role, check their role and redirect
            checkUserRole(auth.currentUser.uid);
        })
        .catch((error) => alert(error.message));
});

// Login
document.getElementById("login-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            checkUserRole(user.uid);  // Check the user's role and redirect
        })
        .catch((error) => alert(error.message));
});

// Google Authentication for Register and Login
document.getElementById("google-register")?.addEventListener("click", googleSignIn);
document.getElementById("google-login")?.addEventListener("click", googleSignIn);

function googleSignIn() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            checkUserRole(user.uid);  // Check the user's role and redirect
        })
        .catch((error) => alert(error.message));
}

// Function to check user role in Firestore and redirect accordingly
function checkUserRole(uid) {
    getDoc(doc(db, "users", uid))
        .then((docSnapshot) => {
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                if (userData.role === "restaurant") {
                    window.location.href = "restaurant.html";  // Redirect to Restaurant dashboard
                } else if (userData.role === "ngo") {
                    window.location.href = "ngo.html";  // Redirect to NGO dashboard
                } else {
                    window.location.href = "dashboard.html";  // Default dashboard
                }
            } else {
                alert("User role not found in Firestore.");
            }
        })
        .catch((error) => alert("Error getting user data: " + error.message));
}
