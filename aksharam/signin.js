import {
    auth,
    provider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail
} from "./firebase.js";

const email = document.getElementById("email");
const password = document.getElementById("password");

const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const googleBtn = document.getElementById("googleBtn");
const forgotBtn = document.getElementById("forgotBtn");

const message = document.getElementById("message");

function showMessage(text, success = false) {
    message.textContent = text;
    message.style.color = success ? "#1F6F5C" : "#C62828";
}

function getFriendlyErrorMessage(error) {
    const code = error?.code || '';
    const msg = error?.message || '';
    if (code.includes('invalid-credential') || code.includes('user-not-found') || code.includes('wrong-password')) {
        return "Invalid email or password. Please try again.";
    }
    if (code.includes('email-already-in-use')) {
        return "An account already exists with this email. Please sign in instead.";
    }
    if (code.includes('invalid-email')) {
        return "Please enter a valid email address.";
    }
    if (code.includes('weak-password')) {
        return "Password must be at least 6 characters.";
    }
    if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) {
        return "Sign-in popup was closed.";
    }
    if (code.includes('too-many-requests')) {
        return "Too many attempts. Please try again in a minute.";
    }
    return msg || "An error occurred. Please try again.";
}

// -----------------------
// Sign In
// -----------------------

loginBtn.addEventListener("click", async () => {

    if (!email.value || !password.value) {
        showMessage("Please enter your email and password.");
        return;
    }

    try {

        await signInWithEmailAndPassword(
            auth,
            email.value,
            password.value
        );

        showMessage("Login successful!", true);

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 700);

    }

    catch (error) {
        showMessage(getFriendlyErrorMessage(error));
    }

});


// -----------------------
// Create Account
// -----------------------

signupBtn.addEventListener("click", async () => {

    if (!email.value || !password.value) {
        showMessage("Please enter your email and password.");
        return;
    }

    if (password.value.length < 6) {

        showMessage("Password must be at least 6 characters.");

        return;

    }

    try {

        await createUserWithEmailAndPassword(

            auth,

            email.value,

            password.value

        );

        showMessage("Account created successfully!", true);

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 800);

    }

    catch (error) {
        showMessage(getFriendlyErrorMessage(error));
    }

});



// -----------------------
// Google Login
// -----------------------

googleBtn.addEventListener("click", async () => {

    try {

        await signInWithPopup(
            auth,
            provider
        );

        window.location.href = "dashboard.html";

    }

    catch (error) {
        showMessage(getFriendlyErrorMessage(error));
    }

});




// -----------------------
// Forgot Password
// -----------------------

forgotBtn.addEventListener("click", async () => {

    if (!email.value) {
        showMessage("Enter your email first.");
        return;
    }

    try {

        await sendPasswordResetEmail(
            auth,
            email.value
        );

        showMessage(
            "Password reset email sent. Check your inbox.",
            true
        );

    }

    catch (error) {
        showMessage(getFriendlyErrorMessage(error));
    }

});
