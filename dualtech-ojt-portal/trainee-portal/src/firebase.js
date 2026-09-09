import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

// Primary App (ASTP & Authentication & Masterlist)
const primaryConfig = {
    apiKey: "AIzaSyAPpy4VcR2uTIPmH01aJ3GvegSDzNNpM9U",
    authDomain: "dualtech-ojt-portal.firebaseapp.com",
    projectId: "dualtech-ojt-portal",
    storageBucket: "dualtech-ojt-portal.firebasestorage.app",
    messagingSenderId: "255242185978",
    appId: "1:255242185978:web:2f07c554fad2e3a78ead43"
};

export const primaryApp = initializeApp(primaryConfig, "Primary");
export const primaryAppCheck = initializeAppCheck(primaryApp, {
    provider: new ReCaptchaEnterpriseProvider('6LeGUowtAAAAALQKvlwQ1T7UtdbAqcL47wPVBxff'),
    isTokenAutoRefreshEnabled: true
});
export const primaryAuth = getAuth(primaryApp);
export const primaryDb = getFirestore(primaryApp);
export const primaryStorage = getStorage(primaryApp);
export const primaryFunctions = getFunctions(primaryApp);

// Secondary App (BSTP Functions)
const secondaryConfig = {
    apiKey: "AIzaSyCsZJFup7MWtDQdWCVKnADA62rHhyvvMnU",
    authDomain: "fst-att-26.firebaseapp.com",
    projectId: "fst-att-26",
    storageBucket: "fst-att-26.firebasestorage.app",
    messagingSenderId: "170608198137",
    appId: "1:170608198137:web:1c3c809ae913123b047d28"
};

export const secondaryApp = initializeApp(secondaryConfig, "Secondary");
export const secondaryAuth = getAuth(secondaryApp);
export const secondaryDb = getFirestore(secondaryApp);
export const secondaryStorage = getStorage(secondaryApp);
export const secondaryFunctions = getFunctions(secondaryApp);

