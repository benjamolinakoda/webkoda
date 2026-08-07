// ===== Autenticacion basada en localStorage =====
// NOTA: esto es un esquema de autenticacion 100% del lado del cliente, pensado
// para una demo sin backend. El "hash" no es criptografico y las contrasenias
// viven en el navegador del usuario. No usar este esquema para un sitio con
// datos sensibles reales sin reemplazarlo por autenticacion en un servidor.

const USERS_KEY = "koda_users";
const SESSION_KEY = "koda_session";

function simpleHash(text) {
    let hash = 5381;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) + hash) + text.charCodeAt(i);
        hash = hash | 0;
    }
    return "h" + Math.abs(hash).toString(36);
}

function hashPassword(password, salt) {
    return simpleHash(salt + ":" + password + ":" + salt);
}

function seedAdminUser() {
    const users = getJSON(USERS_KEY, null);
    if (users !== null) return;
    const salt = generateId("salt");
    const admin = {
        id: generateId("user"),
        nombre: "Administrador Koda",
        email: "admin@kodabebidas.com",
        telefono: "",
        direccion: "",
        salt: salt,
        passwordHash: hashPassword("admin123", salt),
        isAdmin: true,
        fechaRegistro: new Date().toISOString()
    };
    setJSON(USERS_KEY, [admin]);
}
seedAdminUser();

function getUsers() {
    return getJSON(USERS_KEY, []);
}

function saveUsers(users) {
    setJSON(USERS_KEY, users);
}

function findUserByEmail(email) {
    const normalized = String(email).trim().toLowerCase();
    return getUsers().find(u => u.email.toLowerCase() === normalized);
}

function registerUser(data) {
    const email = String(data.email).trim().toLowerCase();
    if (findUserByEmail(email)) {
        return { ok: false, error: "Ya existe una cuenta registrada con ese email." };
    }
    const salt = generateId("salt");
    const user = {
        id: generateId("user"),
        nombre: data.nombre.trim(),
        email: email,
        telefono: (data.telefono || "").trim(),
        direccion: (data.direccion || "").trim(),
        salt: salt,
        passwordHash: hashPassword(data.password, salt),
        isAdmin: false,
        fechaRegistro: new Date().toISOString()
    };
    const users = getUsers();
    users.push(user);
    saveUsers(users);
    setSession(user.id);
    mergeGuestCartIntoUser(user.id);
    return { ok: true, user: user };
}

function loginUser(email, password) {
    const user = findUserByEmail(email);
    if (!user) {
        return { ok: false, error: "No encontramos una cuenta con ese email." };
    }
    if (hashPassword(password, user.salt) !== user.passwordHash) {
        return { ok: false, error: "La contrasenia es incorrecta." };
    }
    setSession(user.id);
    mergeGuestCartIntoUser(user.id);
    return { ok: true, user: user };
}

function setSession(userId) {
    setJSON(SESSION_KEY, { userId: userId });
}

function logoutUser() {
    localStorage.removeItem(SESSION_KEY);
}

function getCurrentUser() {
    const session = getJSON(SESSION_KEY, null);
    if (!session) return null;
    const users = getUsers();
    return users.find(u => u.id === session.userId) || null;
}

function updateCurrentUser(patch) {
    const user = getCurrentUser();
    if (!user) return null;
    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) return null;
    users[idx] = Object.assign({}, users[idx], patch);
    saveUsers(users);
    return users[idx];
}

function requireAuth(redirectTo) {
    const user = getCurrentUser();
    if (!user) {
        const next = encodeURIComponent(location.pathname.split("/").pop());
        location.href = (redirectTo || "login.html") + "?next=" + next;
        return null;
    }
    return user;
}

function requireAdmin() {
    const user = getCurrentUser();
    if (!user || !user.isAdmin) {
        location.href = "login.html?next=admin.html";
        return null;
    }
    return user;
}

// ===== Recuperacion de contrasenia (simulada, sin envio real de emails) =====
const RESET_CODES_KEY = "koda_reset_codes";

function requestPasswordReset(email) {
    const user = findUserByEmail(email);
    if (!user) {
        return { ok: false, error: "No encontramos una cuenta con ese email." };
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codes = getJSON(RESET_CODES_KEY, {});
    codes[user.email] = { code: code, expires: Date.now() + 15 * 60 * 1000 };
    setJSON(RESET_CODES_KEY, codes);
    return { ok: true, code: code };
}

function confirmPasswordReset(email, code, newPassword) {
    const user = findUserByEmail(email);
    if (!user) return { ok: false, error: "No encontramos una cuenta con ese email." };
    const codes = getJSON(RESET_CODES_KEY, {});
    const entry = codes[user.email];
    if (!entry || entry.code !== String(code).trim()) {
        return { ok: false, error: "El codigo ingresado no es valido." };
    }
    if (Date.now() > entry.expires) {
        return { ok: false, error: "El codigo expiro. Pedi uno nuevo." };
    }
    const salt = generateId("salt");
    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    users[idx].salt = salt;
    users[idx].passwordHash = hashPassword(newPassword, salt);
    saveUsers(users);
    delete codes[user.email];
    setJSON(RESET_CODES_KEY, codes);
    return { ok: true };
}
