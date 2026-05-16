import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAkrI-wgj2_-CBnzh6G7Q6KFjxjxhIfmcs",
  authDomain: "proyecto-valou.firebaseapp.com",
  projectId: "proyecto-valou",
  storageBucket: "proyecto-valou.firebasestorage.app",
  messagingSenderId: "456898536161",
  appId: "1:456898536161:web:5547adb763a811ee6c8da0",
  measurementId: "G-YVBM4ZVV8R"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
