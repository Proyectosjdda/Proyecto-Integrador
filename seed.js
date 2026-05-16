import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

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
const auth = getAuth(app);

const users = [
  { email: "user1@valou.com", password: "Password123!" },
  { email: "user2@valou.com", password: "Password123!" },
  { email: "user3@valou.com", password: "Password123!" },
  { email: "user4@valou.com", password: "Password123!" },
];

async function seed() {
  for (const u of users) {
    try {
      await createUserWithEmailAndPassword(auth, u.email, u.password);
      console.log("Created", u.email);
    } catch (e) {
      console.error("Error creating", u.email, e.message);
    }
  }
  process.exit(0);
}
seed();
