// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { collection, getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAqZUkSe6crba3J1dzmcUoTQq7Mvr-Sp2s",
  authDomain: "fit2101-8fb1e.firebaseapp.com",
  projectId: "fit2101-8fb1e",
  storageBucket: "fit2101-8fb1e.appspot.com",
  messagingSenderId: "421042185630",
  appId: "1:421042185630:web:4f9cb98ca0de34ba18a28f",
  measurementId: "G-CMBRZEBWXN"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
// Initialize Firestore
const db = getFirestore(firebaseApp);

export const cardRef = collection(db, "tasks");
export const historyRef = collection(db, "history");
export const sprintRef = collection(db, "sprints")
export const userRef = collection(db, "users")
// Export both firebaseApp and db for use in other parts of the app
export { db, firebaseApp, auth };