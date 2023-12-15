// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase} from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdcl_lUkpRerdphfQUqp2xwvF39IBlB2k",
  authDomain: "test-a4f01.firebaseapp.com",
  databaseURL: "https://test-a4f01-default-rtdb.firebaseio.com",
  projectId: "test-a4f01",
  storageBucket: "test-a4f01.appspot.com",
  messagingSenderId: "132211264694",
  appId: "1:132211264694:web:27c1b6aa15a17d1388aa17",
  measurementId: "G-TDHPXKSKTL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app)
export default db
