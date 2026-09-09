const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, limit, query } = require("firebase/firestore");

// We need to use firebase-admin, or we can just read the local firebase?
// Actually, firebase-admin is better if we have the credentials, but wait...
