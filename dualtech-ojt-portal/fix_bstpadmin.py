
import re

with open("C:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html", "r", encoding="utf-8") as f:
    text = f.read()

# Add importmap entry for firebase/functions
importmap_target = "\"firebase/firestore\": \"https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js\","
importmap_replacement = "\"firebase/firestore\": \"https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js\",\n            \"firebase/functions\": \"https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js\","
text = text.replace(importmap_target, importmap_replacement)

# Add imports for functions
import_target = "import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDoc, getDocs, query, where, updateDoc, orderBy, limit } from 'firebase/firestore';"
import_replacement = "import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDoc, getDocs, query, where, updateDoc, orderBy, limit } from 'firebase/firestore';\n        import { getFunctions, httpsCallable } from 'firebase/functions';"
text = text.replace(import_target, import_replacement)

# Add functions initialization
init_target = "const db = getFirestore(app);"
init_replacement = "const db = getFirestore(app);\n        const functions = getFunctions(app, \"asia-southeast1\");"
text = text.replace(init_target, init_replacement)

with open("C:/Users/rober/dualtech-ojt-portal/public/bstpadmin.html", "w", encoding="utf-8") as f:
    f.write(text)
print("done step 1")

