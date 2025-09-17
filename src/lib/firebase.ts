import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

console.log("Initializing Firebase...");

const firebaseConfig = {
  apiKey: "AIzaSyCCEDd7T9V6zo_fYw_KWD5mW9btLC3o6pQ",
  authDomain: "movie-and-series-b78d0.firebaseapp.com",
  databaseURL: "https://movie-and-series-b78d0-default-rtdb.firebaseio.com",
  projectId: "movie-and-series-b78d0",
  storageBucket: "movie-and-series-b78d0.appspot.com",
  messagingSenderId: "594111766360",
  appId: "1:594111766360:web:39ad09dd2490ff445f0f2d"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const storage = getStorage(app);

console.log("Firebase initialized successfully");

export default app;