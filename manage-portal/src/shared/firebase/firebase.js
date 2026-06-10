import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAhfXhP2e898JUQnB-x3rHKTa15AppyMx8",
  authDomain: "manage-portal-f09a4.firebaseapp.com",
  projectId: "manage-portal-f09a4",
  storageBucket: "manage-portal-f09a4.firebasestorage.app",
  messagingSenderId: "618393130035",
  appId: "1:618393130035:web:27819a7cd2d06eabab7f46"
};

const app      = initializeApp(firebaseConfig);
export const auth     = getAuth(app);
export const provider = new GoogleAuthProvider();