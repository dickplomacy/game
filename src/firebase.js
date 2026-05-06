import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDfGpKq4ju47y8DnJ5oSBx5yj-lQDt5FBg",
  authDomain: "dickplomacy.firebaseapp.com",
  projectId: "dickplomacy",
  storageBucket: "dickplomacy.firebasestorage.app",
  messagingSenderId: "839907985789",
  appId: "1:839907985789:web:348fa85a52e63d5c432414"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
