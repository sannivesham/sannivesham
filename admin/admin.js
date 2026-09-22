import { auth }

from "../firebase-config.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "dashboard.html";
  }
});


const loginBtn =
document.getElementById("loginBtn");

const message =
document.getElementById("adminMessage");


loginBtn.addEventListener("click", () => {

  const email =
  document.getElementById("adminEmail").value;

  const password =
  document.getElementById("adminPassword").value;

  signInWithEmailAndPassword(
    auth,
    email,
    password
  )

  .then(() => {

    message.innerHTML =
    "✅ Login Successful";

    window.location.href =
    "dashboard.html";

  })

  .catch((error) => {

    message.innerHTML =
    "❌ " + error.message;

  });

});