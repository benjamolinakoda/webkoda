// Helpers generales + acceso al catalogo (base estatica + overrides del admin en Firestore).
import { db, doc, getDoc, collection, getDocs } from "./firebase-init.js";

// ===== Constantes del negocio =====
export const WHATSAPP_NUMBER = "5493515514530"; // +54 9 351 551-4530
export const MAYORISTA_MIN = 100000; // subtotal minimo (ARS) para habilitar checkout mayorista
export const PAGE_SIZE = 24; // productos por pagina en el catalogo

// ===== Helpers de moneda / texto =====
export function formatCurrency(value) {
    const n = Math.round(Number(value) || 0);
    return "$" + n.toLocaleString("es-AR");
}

export function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function generateId(prefix) {
    return (prefix || "id") + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

// ===== Helpers de localStorage (solo para preferencias de dispositivo: modo y carrito invitado) =====
export function getJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        return JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
}

export function setJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// ===== WhatsApp =====
export function buildWhatsAppLink(message) {
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
}

// ===== Productos: base estatica (js/data/products.js) + overrides en Firestore =====
let cache = null; // { overrides, deleted, custom }

async function loadOverridesCache() {
    if (cache) return cache;
    const [overridesSnap, deletedSnap, customSnap] = await Promise.all([
        getDocs(collection(db, "productOverrides")),
        getDocs(collection(db, "productDeleted")),
        getDocs(collection(db, "productCustom"))
    ]);
    const overrides = {};
    overridesSnap.forEach((d) => { overrides[d.id] = d.data(); });
    const deleted = [];
    deletedSnap.forEach((d) => { deleted.push(Number(d.id)); });
    const custom = [];
    customSnap.forEach((d) => { custom.push(Object.assign({ id: Number(d.id) }, d.data())); });
    cache = { overrides, deleted, custom };
    return cache;
}

export function invalidateProductCache() {
    cache = null;
}

export async function getAllProducts() {
    const { overrides, deleted, custom } = await loadOverridesCache();
    const base = (window.KODA_PRODUCTS || [])
        .filter((p) => !deleted.includes(p.id))
        .map((p) => (overrides[p.id] ? Object.assign({}, p, overrides[p.id]) : p));
    return base.concat(custom);
}

export async function getProductById(id) {
    const numId = Number(id);
    const all = await getAllProducts();
    return all.find((p) => p.id === numId);
}

export async function getCategories() {
    const all = await getAllProducts();
    const cats = {};
    all.forEach((p) => { cats[p.categoria] = (cats[p.categoria] || 0) + 1; });
    return Object.keys(cats).sort().map((name) => ({ name, count: cats[name] }));
}

export const CATEGORY_IMAGE_MAP = {
    "Fernet": "fernet", "Vodka": "vodka", "Whisky": "whisky", "Espumantes": "espumantes",
    "Licores": "licores", "Aperitivos": "aperitivos", "Cervezas": "cervezas", "Gaseosas": "gaseosas",
    "Gin": "gin", "Ron": "ron", "Cognac": "cognac", "Tequila": "tequila",
    "Vinos": "vinos", "Otros": "otros"
};

export function categoryImage(categoria) {
    const slug = CATEGORY_IMAGE_MAP[categoria];
    return slug ? "img/categorias/placeholder-" + slug + ".svg" : "img/placeholder-botella.svg";
}

export async function getBodegas() {
    const all = await getAllProducts();
    const set = {};
    all.filter((p) => p.categoria === "Vinos" && p.bodega).forEach((p) => {
        set[p.bodega] = (set[p.bodega] || 0) + 1;
    });
    return Object.keys(set).sort().map((name) => ({ name, count: set[name] }));
}

export function bindGlobalSearch() {
    const input = document.getElementById("globalSearch");
    const btn = document.getElementById("globalSearchBtn");
    if (!input) return;
    const trigger = () => {
        const q = input.value.trim();
        if (typeof window.KODA_SEARCH_HANDLER === "function") {
            window.KODA_SEARCH_HANDLER(q);
        } else {
            location.href = "catalogo.html" + (q ? ("?q=" + encodeURIComponent(q)) : "");
        }
    };
    if (btn) btn.addEventListener("click", (e) => { e.preventDefault(); trigger(); });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); trigger(); } });
}
