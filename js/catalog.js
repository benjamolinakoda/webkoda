(function () {
    const state = {
        category: "all",
        bodega: "",
        query: "",
        page: 1
    };

    const params = new URLSearchParams(location.search);
    if (params.get("cat")) state.category = params.get("cat");
    if (params.get("bodega")) state.bodega = params.get("bodega");
    if (params.get("q")) state.query = params.get("q");

    window.KODA_SEARCH_HANDLER = function (q) {
        state.query = q;
        state.page = 1;
        render();
    };

    function updateModeButtons() {
        const mode = getMode();
        document.querySelectorAll("#modeToggle button").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.mode === mode);
        });
        const note = document.getElementById("mayoristaNote");
        if (mode === "mayorista") {
            note.textContent = "Pedido mayorista: subtotal mínimo " + formatCurrency(MAYORISTA_MIN);
        } else {
            note.textContent = "Comprá al por menor, sin mínimo de compra";
        }
    }

    document.getElementById("modeToggle").addEventListener("click", function (e) {
        const btn = e.target.closest("button[data-mode]");
        if (!btn) return;
        setMode(btn.dataset.mode);
        updateModeButtons();
        renderGrid();
    });

    function renderCategoryList() {
        const categories = getCategories();
        const list = document.getElementById("categoryList");
        const allCount = categories.reduce((s, c) => s + c.count, 0);
        let html = '<button type="button" class="filter-chip' + (state.category === "all" ? " active" : "") + '" data-cat="all"><span>Todas</span><span class="count">' + allCount + '</span></button>';
        categories.forEach(c => {
            html += '<button type="button" class="filter-chip' + (state.category === c.name ? " active" : "") + '" data-cat="' + escapeHtml(c.name) + '"><span>' + escapeHtml(c.name) + '</span><span class="count">' + c.count + '</span></button>';
        });
        list.innerHTML = html;
        list.querySelectorAll("button").forEach(btn => {
            btn.addEventListener("click", function () {
                state.category = btn.dataset.cat;
                state.page = 1;
                if (state.category !== "Vinos") state.bodega = "";
                render();
            });
        });
        document.getElementById("bodegaGroup").style.display = state.category === "Vinos" ? "" : "none";
    }

    function renderBodegaSelect() {
        const select = document.getElementById("bodegaSelect");
        const bodegas = getBodegas();
        let html = '<option value="">Todas las bodegas</option>';
        bodegas.forEach(b => {
            html += '<option value="' + escapeHtml(b.name) + '"' + (state.bodega === b.name ? " selected" : "") + '>' + escapeHtml(b.name) + ' (' + b.count + ')</option>';
        });
        select.innerHTML = html;
    }

    document.getElementById("bodegaSelect").addEventListener("change", function () {
        state.bodega = this.value;
        state.page = 1;
        renderGrid();
    });

    function getFilteredProducts() {
        const q = state.query.trim().toLowerCase();
        return getAllProducts().filter(p => {
            if (state.category !== "all" && p.categoria !== state.category) return false;
            if (state.bodega && p.bodega !== state.bodega) return false;
            if (q) {
                const haystack = (p.nombre + " " + p.categoria + " " + (p.bodega || "")).toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });
    }

    function productCardHtml(p) {
        const mode = getMode();
        const price = getUnitPrice(p, mode);
        const priceHtml = p.consultar
            ? '<span class="consultar-tag">Consultar precio</span>'
            : '<span class="price">' + formatCurrency(price) + '</span><button type="button" class="add-btn" data-add="' + p.id + '" aria-label="Agregar al carrito">+</button>';

        return (
            '<article class="product-card" data-id="' + p.id + '">' +
                '<a class="thumb" href="producto.html?id=' + p.id + '"><img src="' + p.imagen + '" alt="' + escapeHtml(p.nombre) + '" loading="lazy"></a>' +
                '<div class="body">' +
                    '<span class="category-tag">' + escapeHtml(p.categoria) + '</span>' +
                    '<a href="producto.html?id=' + p.id + '" class="name">' + escapeHtml(p.nombre) + '</a>' +
                    (p.bodega ? '<span class="bodega">' + escapeHtml(p.bodega) + '</span>' : '') +
                    '<div class="price-row">' + priceHtml + '</div>' +
                '</div>' +
            '</article>'
        );
    }

    function renderGrid() {
        const filtered = getFilteredProducts();
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        if (state.page > totalPages) state.page = totalPages;
        const start = (state.page - 1) * PAGE_SIZE;
        const pageItems = filtered.slice(start, start + PAGE_SIZE);

        document.getElementById("resultsTitle").textContent = state.category === "all" ? "Catálogo completo" : state.category;
        document.getElementById("resultsCount").textContent = filtered.length + " producto" + (filtered.length === 1 ? "" : "s");

        const grid = document.getElementById("productGrid");
        if (pageItems.length === 0) {
            grid.innerHTML = '';
            grid.parentElement.querySelector(".empty-state")?.remove();
            const empty = document.createElement("div");
            empty.className = "empty-state";
            empty.textContent = "No encontramos productos con esos filtros. Probá con otra búsqueda.";
            grid.after(empty);
        } else {
            document.querySelector(".empty-state")?.remove();
            grid.innerHTML = pageItems.map(productCardHtml).join("");
        }

        renderPagination(totalPages);
        initHeaderState();
    }

    function renderPagination(totalPages) {
        const el = document.getElementById("pagination");
        if (totalPages <= 1) { el.innerHTML = ""; return; }
        let html = '<button type="button" data-page="' + (state.page - 1) + '" ' + (state.page === 1 ? "disabled" : "") + '>&laquo; Anterior</button>';
        const maxButtons = 7;
        let startPage = Math.max(1, state.page - 3);
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        startPage = Math.max(1, endPage - maxButtons + 1);
        for (let i = startPage; i <= endPage; i++) {
            html += '<button type="button" data-page="' + i + '" class="' + (i === state.page ? "active" : "") + '">' + i + '</button>';
        }
        html += '<button type="button" data-page="' + (state.page + 1) + '" ' + (state.page === totalPages ? "disabled" : "") + '>Siguiente &raquo;</button>';
        el.innerHTML = html;
        el.querySelectorAll("button[data-page]").forEach(btn => {
            btn.addEventListener("click", function () {
                state.page = Number(this.dataset.page);
                renderGrid();
                window.scrollTo({ top: document.querySelector(".catalog-layout").offsetTop - 20, behavior: "smooth" });
            });
        });
    }

    document.getElementById("productGrid").addEventListener("click", function (e) {
        const addBtn = e.target.closest("button[data-add]");
        if (!addBtn) return;
        e.preventDefault();
        addToCart(addBtn.dataset.add, 1);
        initHeaderState();
        addBtn.textContent = "✓";
        setTimeout(() => { addBtn.textContent = "+"; }, 700);
    });

    function render() {
        renderCategoryList();
        renderBodegaSelect();
        renderGrid();
    }

    updateModeButtons();
    render();
    document.getElementById("globalSearch").value = state.query;
})();
