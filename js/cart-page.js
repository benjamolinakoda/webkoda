(function () {
    function updateModeButtons() {
        const mode = getMode();
        document.querySelectorAll("#modeToggle button").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.mode === mode);
        });
    }

    function cartItemHtml(item) {
        const p = item.product;
        return (
            '<div class="cart-item" data-id="' + p.id + '">' +
                '<div class="thumb-sm"><img src="' + p.imagen + '" alt="' + escapeHtml(p.nombre) + '"></div>' +
                '<div class="info">' +
                    '<div class="name">' + escapeHtml(p.nombre) + '</div>' +
                    '<div class="unit-price">' + formatCurrency(item.unitPrice) + ' c/u</div>' +
                '</div>' +
                '<div class="qty-selector">' +
                    '<button type="button" data-minus="' + p.id + '">−</button>' +
                    '<input type="number" min="1" value="' + item.cantidad + '" data-qty="' + p.id + '">' +
                    '<button type="button" data-plus="' + p.id + '">+</button>' +
                '</div>' +
                '<div class="line-total">' + formatCurrency(item.lineTotal) + '</div>' +
                '<button type="button" class="remove-btn" data-remove="' + p.id + '" aria-label="Quitar">✕</button>' +
            '</div>'
        );
    }

    function render() {
        const details = getCartDetails();
        const listEl = document.getElementById("cartItemsList");

        if (details.items.length === 0) {
            listEl.innerHTML = '<div class="empty-state">Tu carrito está vacío. <a href="catalogo.html">Ver catálogo</a></div>';
        } else {
            listEl.innerHTML = details.items.map(cartItemHtml).join("");
        }

        document.getElementById("itemCount").textContent = details.items.reduce((s, i) => s + i.cantidad, 0);
        document.getElementById("subtotalValue").textContent = formatCurrency(details.subtotal);
        document.getElementById("totalValue").textContent = formatCurrency(details.subtotal);

        const progressBlock = document.getElementById("progressBlock");
        const checkoutBtn = document.getElementById("checkoutBtn");

        if (details.mode === "mayorista") {
            progressBlock.style.display = "block";
            const pct = Math.min(100, (details.subtotal / MAYORISTA_MIN) * 100);
            const fill = document.getElementById("progressFill");
            fill.style.width = pct + "%";
            fill.classList.toggle("ready", details.readyForMayorista);
            document.getElementById("progressText").textContent = details.readyForMayorista
                ? "¡Llegaste al mínimo mayorista!"
                : "Te faltan " + formatCurrency(details.missingForMayorista) + " para acceder a precios mayoristas (mínimo " + formatCurrency(MAYORISTA_MIN) + ")";
            checkoutBtn.disabled = details.items.length === 0 || !details.readyForMayorista;
        } else {
            progressBlock.style.display = "none";
            checkoutBtn.disabled = details.items.length === 0;
        }

        initHeaderState();
    }

    document.getElementById("modeToggle").addEventListener("click", function (e) {
        const btn = e.target.closest("button[data-mode]");
        if (!btn) return;
        setMode(btn.dataset.mode);
        updateModeButtons();
        render();
    });

    document.getElementById("cartItemsList").addEventListener("click", function (e) {
        const minus = e.target.closest("[data-minus]");
        const plus = e.target.closest("[data-plus]");
        const remove = e.target.closest("[data-remove]");
        if (minus) {
            const input = document.querySelector('[data-qty="' + minus.dataset.minus + '"]');
            updateCartQty(minus.dataset.minus, Math.max(1, (parseInt(input.value, 10) || 1) - 1));
            render();
        } else if (plus) {
            const input = document.querySelector('[data-qty="' + plus.dataset.plus + '"]');
            updateCartQty(plus.dataset.plus, (parseInt(input.value, 10) || 1) + 1);
            render();
        } else if (remove) {
            removeFromCart(remove.dataset.remove);
            render();
        }
    });

    document.getElementById("cartItemsList").addEventListener("change", function (e) {
        const input = e.target.closest("[data-qty]");
        if (!input) return;
        updateCartQty(input.dataset.qty, input.value);
        render();
    });

    document.getElementById("checkoutBtn").addEventListener("click", function () {
        location.href = "checkout.html";
    });

    updateModeButtons();
    render();
})();
