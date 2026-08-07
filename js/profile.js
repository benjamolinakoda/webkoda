(function () {
    const user = requireAuth("login.html");
    if (!user) return;

    document.getElementById("profNombre").value = user.nombre || "";
    document.getElementById("profEmail").value = user.email || "";
    document.getElementById("profTelefono").value = user.telefono || "";
    document.getElementById("profDireccion").value = user.direccion || "";

    document.getElementById("profileForm").addEventListener("submit", function (e) {
        e.preventDefault();
        updateCurrentUser({
            nombre: document.getElementById("profNombre").value.trim(),
            telefono: document.getElementById("profTelefono").value.trim(),
            direccion: document.getElementById("profDireccion").value.trim()
        });
        const alertBox = document.getElementById("profileAlert");
        alertBox.textContent = "Tus datos se guardaron correctamente.";
        alertBox.style.display = "block";
    });

    document.getElementById("logoutBtn").addEventListener("click", function () {
        logoutUser();
        location.href = "index.html";
    });

    function orderRowHtml(order) {
        const fecha = new Date(order.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
        const items = order.items.map(i => i.cantidad + "x " + escapeHtml(i.nombre)).join(", ");
        return (
            '<div class="order-row">' +
                '<div class="order-header">' +
                    '<strong>Pedido #' + escapeHtml(order.id) + '</strong>' +
                    '<span class="status-pill ' + order.estado + '">' + order.estado + '</span>' +
                '</div>' +
                '<p style="font-size:0.85rem; color:#667; margin-bottom:6px;">' + fecha + ' · ' + (order.modalidad === "mayorista" ? "Mayorista" : "Minorista") + '</p>' +
                '<p style="font-size:0.88rem; margin-bottom:6px;">' + items + '</p>' +
                '<p style="font-weight:700;">Total: ' + formatCurrency(order.subtotal) + '</p>' +
            '</div>'
        );
    }

    const orders = getOrdersForUser(user.id);
    const list = document.getElementById("ordersList");
    list.innerHTML = orders.length === 0
        ? '<p style="color:#667;">Todavía no hiciste ningún pedido. <a href="catalogo.html">Ver catálogo</a></p>'
        : orders.map(orderRowHtml).join("");
})();
