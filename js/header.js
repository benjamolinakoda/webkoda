// Estado del header comun a todas las paginas: badge del carrito, link de cuenta,
// link de admin y resaltado de nav activo. Se llama una vez por pagina despues de authReady.
import { authReady, getCurrentUser } from "./auth.js";
import { getCart } from "./cart.js";
import { bindGlobalSearch } from "./utils.js";

export async function initHeader() {
    await authReady;
    await refreshCartBadge();

    const user = getCurrentUser();
    document.querySelectorAll(".js-account-link").forEach((el) => {
        el.setAttribute("href", user ? "perfil.html" : "login.html");
        el.setAttribute("aria-label", user ? "Mi perfil" : "Ingresar");
    });
    document.querySelectorAll(".js-admin-link").forEach((el) => {
        el.style.display = (user && user.isAdmin) ? "" : "none";
    });

    const current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".links-wrapper a").forEach((a) => {
        if (a.getAttribute("href") === current) a.classList.add("active");
    });

    bindGlobalSearch();
}

export async function refreshCartBadge() {
    const cart = await getCart();
    const totalUnits = cart.reduce((sum, item) => sum + item.cantidad, 0);
    document.querySelectorAll(".js-cart-badge").forEach((el) => {
        el.textContent = totalUnits;
        el.classList.toggle("hidden", totalUnits === 0);
    });
}
