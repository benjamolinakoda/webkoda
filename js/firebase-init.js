// Inicializacion central de Firebase. Todos los demas modulos importan
// auth/db desde aca en vez de llamar a initializeApp de nuevo.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, updateProfile, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc,
    collection, query, where, getDocs, addDoc, onSnapshot, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCvK53MGq1SSNUbdZxztjC5DeLDFvsaLWs",
    authDomain: "koda-bebidas.firebaseapp.com",
    projectId: "koda-bebidas",
    storageBucket: "koda-bebidas.firebasestorage.app",
    messagingSenderId: "146371975777",
    appId: "1:146371975777:web:0df6dd200339537cd86820"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export {
    onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, updateProfile, sendPasswordResetEmail,
    doc, getDoc, setDoc, updateDoc, deleteDoc,
    collection, query, where, getDocs, addDoc, onSnapshot, orderBy
};
