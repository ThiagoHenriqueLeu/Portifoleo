import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBqnMFVmJ87EfotRY7Gnm9J4M4LIqSd-9M",
  authDomain: "boer-373bc.firebaseapp.com",
  databaseURL: "https://boer-373bc-default-rtdb.firebaseio.com",
  projectId: "boer-373bc",
  storageBucket: "boer-373bc.firebasestorage.app",
  messagingSenderId: "358217299397",
  appId: "1:358217299397:web:9a97bb1f3cc07c39b687ac",
  measurementId: "G-WVRLKZ1RRS"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);
export default app;
