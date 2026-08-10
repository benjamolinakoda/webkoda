// Carrito y pedidos en Firestore (compartidos entre dispositivos para el mismo usuario).
// El modo de compra (mayorista/minorista) sigue en localStorage: es una preferencia
// de navegador, no un dato de negocio que haya que centralizar.
import {
    auth, db, doc, getDoc, setDoc, collection, addDoc, getDocs, query, where, updateDoc, orderBy
} from "./firebase-init.js";
import { getJSON, setJSON, getProductById, MAYORISTA_MIN } from "./utils.js";

const MODE_KEY = "koda_mode";
const GUEST_CART_KEY = "koda_cart_guest";

export function getMode() {
    return localStorage.getItem(MODE_KEY) === "mayorista" ? "mayorista" : "minorista";
}

export function setMode(mode) {
    localStorage.setItem(MODE_KEY, mode === "mayorista" ? "mayorista" : "minorista");
}

// ===== Carrito =====
export async function getCart() {
    const user = auth.currentUser;
    if (!user) return getJSON(GUEST_CART_KEY, []);
    const snap = await getDoc(doc(db, "carts", user.uid));
    return snap.exists() ? (snap.data().items || []) : [];
}

async function saveCart(items) {
    const user = auth.currentUser;
    if (!user) {
        setJSON(GUEST_CART_KEY, items);
        return;
    }
    await setDoc(doc(db, "carts", user.uid), { items, actualizado: new Date().toISOString() });
}

export async function addToCart(productId, cantidad) {
    const product = await getProductById(productId);
    if (!product || product.consultar) return;
    cantidad = Math.max(1, parseInt(cantidad, 10) || 1);
    const cart = await getCart();
    const existing = cart.find((i) => i.productId === Number(productId));
    if (existing) {
        existing.cantidad += cantidad;
    } else {
        cart.push({ productId: Number(productId), cantidad });
    }
    await saveCart(cart);
}

export async function updateCartQty(productId, cantidad) {
    cantidad = parseInt(cantidad, 10);
    let cart = await getCart();
    if (!cantidad || cantidad < 1) {
        cart = cart.filter((i) => i.productId !== Number(productId));
    } else {
        const item = cart.find((i) => i.productId === Number(productId));
        if (item) item.cantidad = cantidad;
    }
    await saveCart(cart);
}

export async function removeFromCart(productId) {
    const cart = (await getCart()).filter((i) => i.productId !== Number(productId));
    await saveCart(cart);
}

export async function clearCart() {
    await saveCart([]);
}

export async function mergeGuestCartIntoUser(uid) {
    const guestCart = getJSON(GUEST_CART_KEY, []);
    if (guestCart.length === 0) return;
    const ref = doc(db, "carts", uid);
    const snap = await getDoc(ref);
    const userCart = snap.exists() ? (snap.data().items || []) : [];
    guestCart.forEach((item) => {
        const existing = userCart.find((i) => i.productId === item.productId);
        if (existing) {
            existing.cantidad += item.cantidad;
        } else {
            userCart.push(item);
        }
    });
    await setDoc(ref, { items: userCart, actualizado: new Date().toISOString() });
    localStorage.removeItem(GUEST_CART_KEY);
}

// ===== Calculo de totales segun el modo activo =====
export function getUnitPrice(product, mode) {
    if (product.consultar) return null;
    return mode === "mayorista" ? product.precioMayorista : product.precioMinorista;
}

export async function getCartDetails() {
    const mode = getMode();
    const cart = await getCart();
    const items = (await Promise.all(cart.map(async (item) => {
        const product = await getProductById(item.productId);
        if (!product) return null;
        const unitPrice = getUnitPrice(product, mode);
        return { product, cantidad: item.cantidad, unitPrice, lineTotal: unitPrice * item.cantidad };
    }))).filter(Boolean);

    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const readyForMayorista = subtotal >= MAYORISTA_MIN;
    const missingForMayorista = Math.max(0, MAYORISTA_MIN - subtotal);

    return { mode, items, subtotal, readyForMayorista, missingForMayorista };
}

// ===== Pedidos =====
export async function createOrder(order) {
    await addDoc(collection(db, "orders"), order);
}

export async function getOrdersForUser(userId) {
    const q = query(collection(db, "orders"), where("userId", "==", userId));
    const snap = await getDocs(q);
    const orders = [];
    snap.forEach((d) => orders.push(Object.assign({ docId: d.id }, d.data())));
    return orders.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export async function getAllOrders() {
    const snap = await getDocs(collection(db, "orders"));
    const orders = [];
    snap.forEach((d) => orders.push(Object.assign({ docId: d.id }, d.data())));
    return orders.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export async function updateOrderStatus(docId, estado) {
    await updateDoc(doc(db, "orders", docId), { estado });
}
