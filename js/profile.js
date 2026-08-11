import { escapeHtml, formatCurrency, buildWhatsAppLink } from "./utils.js";
import { getOrdersForUser } from "./cart.js";
import { requireAuth, updateCurrentUser, logoutUser } from "./auth.js";
import { initHeader } from "./header.js";

(async function () {
    await initHeader();

    const user = await requireAuth("login.html");
    if (!user) return;

    document.getElementById("profNombre").value = user.nombre || "";
    document.getElementById("profEmail").value = user.email || "";
    document.getElementById("profTelefono").value = user.telefono || "";
    document.getElementById("profDireccion").value = user.direccion || "";

    document.getElementById("profileForm").addEventListener("submit", async function (e) {
        e.preventDefault();
        await updateCurrentUser({
            nombre: document.getElementById("profNombre").value.trim(),
            telefono: document.getElementById("profTelefono").value.trim(),
            direccion: document.getElementById("profDireccion").value.trim()
        });
        const alertBox = document.getElementById("profileAlert");
        alertBox.textContent = "Tus datos se guardaron correctamente.";
        alertBox.style.display = "block";
    });

    document.getElementById("logoutBtn").addEventListener("click", async function () {
        await logoutUser();
        location.href = "index.html";
    });

    function orderRowHtml(order) {
        const fecha = new Date(order.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
        const items = order.items.map((i) => i.cantidad + "x " + escapeHtml(i.nombre)).join(", ");
        const canCancel = order.estado !== "cancelado";
        const cancelMsg = "Hola KODA Bebidas! Quiero ejercer mi derecho de arrepentimiento y solicitar la cancelación del pedido #" + order.id + ".";
        const cancelBtn = canCancel
            ? '<a class="btn btn-ghost btn-sm" style="margin-top:10px;" target="_blank" rel="noopener" href="' + buildWhatsAppLink(cancelMsg) + '">Solicitar cancelación</a>'
            : "";
        return (
            '<div class="order-row">' +
                '<div class="order-header">' +
                    '<strong>Pedido #' + escapeHtml(order.id) + '</strong>' +
                    '<span class="status-pill ' + order.estado + '">' + order.estado + '</span>' +
                '</div>' +
                '<p style="font-size:0.85rem; color:#667; margin-bottom:6px;">' + fecha + ' · ' + (order.modalidad === "mayorista" ? "Mayorista" : "Minorista") + '</p>' +
                '<p style="font-size:0.88rem; margin-bottom:6px;">' + items + '</p>' +
                '<p style="font-weight:700;">Total: ' + formatCurrency(order.subtotal) + '</p>' +
                cancelBtn +
            '</div>'
        );
    }

    const orders = await getOrdersForUser(user.uid);
    const list = document.getElementById("ordersList");
    list.innerHTML = orders.length === 0
        ? '<p style="color:#667;">Todavía no hiciste ningún pedido. <a href="catalogo.html">Ver catálogo</a></p>'
        : orders.map(orderRowHtml).join("");
})();
