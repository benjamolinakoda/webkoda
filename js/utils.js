// ===== Constantes del negocio =====
const WHATSAPP_NUMBER = "5493515514530"; // +54 9 351 551-4530
const MAYORISTA_MIN = 100000; // subtotal minimo (ARS) para habilitar checkout mayorista
const PAGE_SIZE = 24; // productos por pagina en el catalogo

// ===== Helpers de moneda / texto =====
function formatCurrency(value) {
    const n = Math.round(Number(value) || 0);
    return "$" + n.toLocaleString("es-AR");
}

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function generateId(prefix) {
    return (prefix || "id") + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

// ===== Helpers de localStorage =====
function getJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        return JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
}

function setJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// ===== WhatsApp =====
function buildWhatsAppLink(message) {
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
}

// ===== Productos (busqueda por id sobre el dataset base + overrides de admin) =====
function getAllProducts() {
    const overrides = getJSON("koda_product_overrides", {});
    const deleted = getJSON("koda_product_deleted", []);
    const custom = getJSON("koda_product_custom", []);
    const base = (typeof KODA_PRODUCTS !== "undefined" ? KODA_PRODUCTS : [])
        .filter(p => !deleted.includes(p.id))
        .map(p => overrides[p.id] ? Object.assign({}, p, overrides[p.id]) : p);
    return base.concat(custom);
}

function getProductById(id) {
    const numId = Number(id);
    return getAllProducts().find(p => p.id === numId);
}

function getCategories() {
    const cats = {};
    getAllProducts().forEach(p => {
        cats[p.categoria] = (cats[p.categoria] || 0) + 1;
    });
    return Object.keys(cats).sort().map(name => ({ name, count: cats[name] }));
}

function getBodegas() {
    const set = {};
    getAllProducts().filter(p => p.categoria === "Vinos" && p.bodega).forEach(p => {
        set[p.bodega] = (set[p.bodega] || 0) + 1;
    });
    return Object.keys(set).sort().map(name => ({ name, count: set[name] }));
}

// ===== Header comun (badge carrito + estado de sesion) =====
function initHeaderState() {
    const cart = getCart();
    const totalUnits = cart.reduce((sum, item) => sum + item.cantidad, 0);
    document.querySelectorAll(".js-cart-badge").forEach(el => {
        el.textContent = totalUnits;
        el.classList.toggle("hidden", totalUnits === 0);
    });

    const user = getCurrentUser();
    document.querySelectorAll(".js-account-link").forEach(el => {
        el.setAttribute("href", user ? "perfil.html" : "login.html");
        el.setAttribute("aria-label", user ? "Mi perfil" : "Ingresar");
    });
    document.querySelectorAll(".js-admin-link").forEach(el => {
        el.style.display = (user && user.isAdmin) ? "" : "none";
    });

    const nav = document.querySelectorAll(".links-wrapper a");
    const current = location.pathname.split("/").pop() || "index.html";
    nav.forEach(a => {
        if (a.getAttribute("href") === current) a.classList.add("active");
    });
}

function bindGlobalSearch() {
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

document.addEventListener("DOMContentLoaded", function () {
    initHeaderState();
    bindGlobalSearch();
});
