import { formatCurrency, escapeHtml, generateId, buildWhatsAppLink } from "./utils.js";
import { getCartDetails, clearCart, createOrder } from "./cart.js";
import { requireAuth } from "./auth.js";
import { initHeader, refreshCartBadge } from "./header.js";

(async function () {
    await initHeader();

    const user = await requireAuth("login.html");
    if (!user) return;

    const details = await getCartDetails();
    if (details.items.length === 0) {
        location.href = "carrito.html";
        return;
    }
    if (details.mode === "mayorista" && !details.readyForMayorista) {
        location.href = "carrito.html";
        return;
    }

    document.getElementById("nombreCliente").value = user.nombre || "";
    document.getElementById("telefonoCliente").value = user.telefono || "";
    document.getElementById("direccionCliente").value = user.direccion || "";

    document.getElementById("orderModeBadge").textContent = "Modalidad: " + (details.mode === "mayorista" ? "Mayorista" : "Minorista");

    document.getElementById("orderLines").innerHTML = details.items.map((i) =>
        '<div class="order-line"><span>' + i.cantidad + 'x ' + escapeHtml(i.product.nombre) + '</span><span>' + formatCurrency(i.lineTotal) + '</span></div>'
    ).join("");
    document.getElementById("orderTotal").textContent = formatCurrency(details.subtotal);

    function validate() {
        let valid = true;
        ["nombreCliente", "telefonoCliente", "direccionCliente", "pagoCliente"].forEach((id) => {
            const input = document.getElementById(id);
            const group = input.closest(".form-group");
            const isEmpty = !input.value.trim();
            group.classList.toggle("invalid", isEmpty);
            if (isEmpty) valid = false;
        });
        return valid;
    }

    function buildWhatsAppMessage(order) {
        let msg = "Hola KODA Bebidas! Quiero coordinar el siguiente pedido:\n\n";
        msg += "Pedido #" + order.id + "\n";
        msg += "Modalidad: " + (order.modalidad === "mayorista" ? "Mayorista" : "Minorista") + "\n\n";
        order.items.forEach((i) => {
            msg += "- " + i.cantidad + "x " + i.nombre + " (" + formatCurrency(i.precioUnitario) + " c/u) = " + formatCurrency(i.precioUnitario * i.cantidad) + "\n";
        });
        msg += "\nSubtotal: " + formatCurrency(order.subtotal) + "\n\n";
        msg += "Datos de entrega:\n";
        msg += "Nombre: " + order.cliente.nombre + "\n";
        msg += "Teléfono: " + order.cliente.telefono + "\n";
        msg += "Dirección: " + order.cliente.direccion + "\n";
        msg += "Forma de pago preferida: " + order.cliente.pago + "\n";
        if (order.cliente.notas) msg += "Notas: " + order.cliente.notas + "\n";
        return msg;
    }

    document.getElementById("checkoutForm").addEventListener("submit", async function (e) {
        e.preventDefault();
        if (!validate()) return;

        const order = {
            id: generateId("pedido").slice(-8).toUpperCase(),
            userId: user.uid,
            modalidad: details.mode,
            items: details.items.map((i) => ({
                productId: i.product.id,
                nombre: i.product.nombre,
                cantidad: i.cantidad,
                precioUnitario: i.unitPrice
            })),
            subtotal: details.subtotal,
            estado: "pendiente",
            fecha: new Date().toISOString(),
            cliente: {
                nombre: document.getElementById("nombreCliente").value.trim(),
                telefono: document.getElementById("telefonoCliente").value.trim(),
                direccion: document.getElementById("direccionCliente").value.trim(),
                pago: document.getElementById("pagoCliente").value,
                notas: document.getElementById("notasCliente").value.trim()
            }
        };

        await createOrder(order);
        await clearCart();
        await refreshCartBadge();

        const waLink = buildWhatsAppLink(buildWhatsAppMessage(order));
        document.getElementById("whatsappLink").setAttribute("href", waLink);
        document.getElementById("checkoutRoot").style.display = "none";
        document.getElementById("confirmationView").style.display = "block";
        document.querySelector("#pageHero h2").textContent = "¡Pedido registrado!";
        document.querySelector("#pageHero p").textContent = "Pedido #" + order.id + " — coordinamos el pago y la entrega por WhatsApp";
        window.open(waLink, "_blank", "noopener");
    });
})();
