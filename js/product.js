(function () {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    const product = getProductById(id);
    const root = document.getElementById("productDetailRoot");

    if (!product) {
        document.getElementById("notFoundMsg").style.display = "block";
        return;
    }

    document.getElementById("pageTitle").textContent = product.nombre + " | KODA BEBIDAS";

    function updateModeButtons() {
        const mode = getMode();
        document.querySelectorAll("#modeToggle button").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.mode === mode);
        });
        const note = document.getElementById("mayoristaNote");
        note.textContent = mode === "mayorista"
            ? "Pedido mayorista: subtotal mínimo " + formatCurrency(MAYORISTA_MIN)
            : "Comprá al por menor, sin mínimo de compra";
    }

    function renderPriceBlock() {
        const mode = getMode();
        const priceBlock = document.getElementById("priceBlock");
        if (product.consultar) {
            priceBlock.innerHTML =
                '<p class="consultar-tag" style="font-size:1rem;">Precio a consultar</p>' +
                '<a class="btn btn-whatsapp btn-lg" style="margin-top:14px;" target="_blank" rel="noopener" href="' +
                buildWhatsAppLink("Hola! Quiero consultar el precio de: " + product.nombre) +
                '">Consultar por WhatsApp</a>';
            return;
        }
        const price = getUnitPrice(product, mode);
        priceBlock.innerHTML =
            '<p class="price-lg">' + formatCurrency(price) + '</p>' +
            '<div class="qty-selector">' +
                '<button type="button" id="qtyMinus">−</button>' +
                '<input type="number" id="qtyInput" value="1" min="1">' +
                '<button type="button" id="qtyPlus">+</button>' +
            '</div>' +
            '<button type="button" class="btn btn-primary btn-lg" id="addToCartBtn" style="margin-left:14px;">Agregar al carrito</button>' +
            '<p id="addedMsg" class="alert alert-success" style="display:none; margin-top:16px;">Se agregó al carrito.</p>';

        document.getElementById("qtyMinus").addEventListener("click", () => {
            const input = document.getElementById("qtyInput");
            input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
        });
        document.getElementById("qtyPlus").addEventListener("click", () => {
            const input = document.getElementById("qtyInput");
            input.value = (parseInt(input.value, 10) || 1) + 1;
        });
        document.getElementById("addToCartBtn").addEventListener("click", () => {
            const qty = parseInt(document.getElementById("qtyInput").value, 10) || 1;
            addToCart(product.id, qty);
            initHeaderState();
            document.getElementById("addedMsg").style.display = "block";
        });
    }

    root.innerHTML =
        '<div class="content-section" style="padding-bottom:0;">' +
            '<a href="catalogo.html?cat=' + encodeURIComponent(product.categoria) + '">&laquo; Volver a ' + escapeHtml(product.categoria) + '</a>' +
        '</div>' +
        '<div class="product-detail">' +
            '<div class="thumb-lg"><img src="' + product.imagen + '" alt="' + escapeHtml(product.nombre) + '"></div>' +
            '<div>' +
                '<span class="category-tag">' + escapeHtml(product.categoria) + '</span>' +
                '<h1>' + escapeHtml(product.nombre) + '</h1>' +
                (product.bodega ? '<p class="bodega">Bodega: ' + escapeHtml(product.bodega) + '</p>' : '') +
                '<div id="priceBlock"></div>' +
            '</div>' +
        '</div>';

    document.getElementById("modeToggle").addEventListener("click", function (e) {
        const btn = e.target.closest("button[data-mode]");
        if (!btn) return;
        setMode(btn.dataset.mode);
        updateModeButtons();
        renderPriceBlock();
    });

    updateModeButtons();
    renderPriceBlock();
})();
