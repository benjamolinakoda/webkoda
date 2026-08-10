// Autenticacion real con Firebase Auth + perfiles de usuario en Firestore
// (coleccion "users", documento por uid).
import {
    auth, db, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, updateProfile, sendPasswordResetEmail, doc, getDoc, setDoc, updateDoc
} from "./firebase-init.js";
import { mergeGuestCartIntoUser } from "./cart.js";

let currentUser = null;
let resolveAuthReady;
export const authReady = new Promise((resolve) => { resolveAuthReady = resolve; });

async function loadProfile(fbUser) {
    const snap = await getDoc(doc(db, "users", fbUser.uid));
    const data = snap.exists() ? snap.data() : {};
    currentUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        nombre: data.nombre || "",
        telefono: data.telefono || "",
        direccion: data.direccion || "",
        isAdmin: !!data.isAdmin
    };
    return currentUser;
}

let authReadyDone = false;
onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
        await loadProfile(fbUser);
        await mergeGuestCartIntoUser(currentUser.uid);
    } else {
        currentUser = null;
    }
    if (!authReadyDone) {
        authReadyDone = true;
        resolveAuthReady(currentUser);
    }
});

export function getCurrentUser() {
    return currentUser;
}

export async function registerUser({ nombre, email, telefono, direccion, password }) {
    try {
        const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
        await updateProfile(cred.user, { displayName: nombre.trim() });
        await setDoc(doc(db, "users", cred.user.uid), {
            nombre: nombre.trim(),
            email: email.trim().toLowerCase(),
            telefono: (telefono || "").trim(),
            direccion: (direccion || "").trim(),
            isAdmin: false,
            fechaRegistro: new Date().toISOString()
        });
        await loadProfile(cred.user);
        await mergeGuestCartIntoUser(currentUser.uid);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: friendlyAuthError(e) };
    }
}

export async function loginUser(email, password) {
    try {
        const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
        await loadProfile(cred.user);
        await mergeGuestCartIntoUser(currentUser.uid);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: friendlyAuthError(e) };
    }
}

export async function logoutUser() {
    await signOut(auth);
}

export async function updateCurrentUser(patch) {
    if (!currentUser) return null;
    await updateDoc(doc(db, "users", currentUser.uid), patch);
    currentUser = Object.assign({}, currentUser, patch);
    return currentUser;
}

export async function requireAuth(redirectTo) {
    const user = await authReady;
    if (!user) {
        const next = encodeURIComponent(location.pathname.split("/").pop());
        location.href = (redirectTo || "login.html") + "?next=" + next;
        return null;
    }
    return user;
}

export async function requireAdmin() {
    const user = await authReady;
    if (!user || !user.isAdmin) {
        location.href = "login.html?next=admin.html";
        return null;
    }
    return user;
}

export async function requestPasswordReset(email) {
    try {
        await sendPasswordResetEmail(auth, email.trim().toLowerCase());
        return { ok: true };
    } catch (e) {
        return { ok: false, error: friendlyAuthError(e) };
    }
}

function friendlyAuthError(e) {
    const code = e && e.code ? e.code : "";
    const map = {
        "auth/email-already-in-use": "Ya existe una cuenta registrada con ese email.",
        "auth/invalid-email": "El email no es valido.",
        "auth/weak-password": "La contrasenia debe tener al menos 6 caracteres.",
        "auth/user-not-found": "No encontramos una cuenta con ese email.",
        "auth/wrong-password": "La contrasenia es incorrecta.",
        "auth/invalid-credential": "Email o contrasenia incorrectos.",
        "auth/too-many-requests": "Demasiados intentos. Probá de nuevo en un rato."
    };
    return map[code] || "Ocurrio un error. Intenta de nuevo.";
}
