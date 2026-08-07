(function () {
    const admin = requireAdmin();
    if (!admin) return;

    const OVERRIDES_KEY = "koda_product_overrides";
    const DELETED_KEY = "koda_product_deleted";
    const CUSTOM_KEY = "koda_product_custom";
    const ADMIN_PAGE_SIZE = 30;

    let state = { search: "", page: 1 };

    // ===== Tabs =====
    document.querySelectorAll(".admin-tabs button").forEach(btn => {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".admin-tabs button").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById(btn.dataset.tab === "productos" ? "panelProductos" : "panelPedidos").classList.add("active");
            if (btn.dataset.tab === "pedidos") renderOrders();
        });
    });

    // ===== Productos =====
    function nextCustomId() {
        const all = getAllProducts();
        return all.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    }

    function isCustom(id) {
        return getJSON(CUSTOM_KEY, []).some(p => p.id === id);
    }

    function priceCell(value, consultar) {
        if (consultar) return '<span class="consultar-tag">Consultar</span>';
        return formatCurrency(value);
    }

    function renderCategoryOptions() {
        const list = document.getElementById("categoriaOptions");
        list.innerHTML = getCategories().map(c => '<option value="' + escapeHtml(c.name) + '">').join("");
    }

    function renderProducts() {
        const q = state.search.trim().toLowerCase();
        const all = getAllProducts().filter(p => !q || p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q));
        const totalPages = Math.max(1, Math.ceil(all.length / ADMIN_PAGE_SIZE));
        if (state.page > totalPages) state.page = totalPages;
        const start = (state.page - 1) * ADMIN_PAGE_SIZE;
        const pageItems = all.slice(start, start + ADMIN_PAGE_SIZE);

        document.getElementById("productsTableBody").innerHTML = pageItems.map(p => (
            '<tr>' +
                '<td>' + escapeHtml(p.nombre) + '</td>' +
                '<td>' + escapeHtml(p.categoria) + '</td>' +
                '<td>' + escapeHtml(p.bodega || "-") + '</td>' +
                '<td>' + priceCell(p.precioMayorista, p.consultar) + '</td>' +
                '<td>' + priceCell(p.precioMinorista, p.consultar) + '</td>' +
                '<td>' + p.stock + '</td>' +
                '<td>' +
                    '<button type="button" class="btn btn-sm btn-ghost" data-edit="' + p.id + '">Editar</button> ' +
                    '<button type="button" class="btn btn-sm btn-danger" data-delete="' + p.id + '">Eliminar</button>' +
                '</td>' +
            '</tr>'
        )).join("");

        renderAdminPagination(totalPages);
    }

    function renderAdminPagination(totalPages) {
        const el = document.getElementById("adminPagination");
        if (totalPages <= 1) { el.innerHTML = ""; return; }
        let html = '<button type="button" data-page="' + (state.page - 1) + '" ' + (state.page === 1 ? "disabled" : "") + '>&laquo;</button>';
        html += '<span style="padding:8px 14px;">Página ' + state.page + ' de ' + totalPages + '</span>';
        html += '<button type="button" data-page="' + (state.page + 1) + '" ' + (state.page === totalPages ? "disabled" : "") + '>&raquo;</button>';
        el.innerHTML = html;
        el.querySelectorAll("button[data-page]").forEach(btn => {
            btn.addEventListener("click", function () {
                state.page = Number(this.dataset.page);
                renderProducts();
            });
        });
    }

    document.getElementById("adminSearch").addEventListener("input", function () {
        state.search = this.value;
        state.page = 1;
        renderProducts();
    });

    // ===== Modal =====
    const modal = document.getElementById("productModal");
    function openModal(product) {
        document.getElementById("modalTitle").textContent = product ? "Editar producto" : "Nuevo producto";
        document.getElementById("prodId").value = product ? product.id : "";
        document.getElementById("prodNombre").value = product ? product.nombre : "";
        document.getElementById("prodCategoria").value = product ? product.categoria : "";
        document.getElementById("prodBodega").value = product && product.bodega ? product.bodega : "";
        document.getElementById("prodMayorista").value = product && product.precioMayorista !== null ? product.precioMayorista : "";
        document.getElementById("prodMinorista").value = product && product.precioMinorista !== null ? product.precioMinorista : "";
        document.getElementById("prodStock").value = product ? product.stock : 50;
        document.getElementById("prodConsultar").value = product && product.consultar ? "true" : "false";
        modal.classList.add("open");
    }
    function closeModal() { modal.classList.remove("open"); }

    document.getElementById("newProductBtn").addEventListener("click", () => openModal(null));
    document.getElementById("cancelModalBtn").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

    document.getElementById("productsTableBody").addEventListener("click", function (e) {
        const editBtn = e.target.closest("[data-edit]");
        const delBtn = e.target.closest("[data-delete]");
        if (editBtn) {
            openModal(getProductById(editBtn.dataset.edit));
        } else if (delBtn) {
            const id = Number(delBtn.dataset.delete);
            if (!confirm("¿Eliminar este producto del catálogo?")) return;
            if (isCustom(id)) {
                const custom = getJSON(CUSTOM_KEY, []).filter(p => p.id !== id);
                setJSON(CUSTOM_KEY, custom);
            } else {
                const deleted = getJSON(DELETED_KEY, []);
                deleted.push(id);
                setJSON(DELETED_KEY, deleted);
            }
            renderProducts();
            renderCategoryOptions();
        }
    });

    document.getElementById("productForm").addEventListener("submit", function (e) {
        e.preventDefault();
        const idField = document.getElementById("prodId").value;
        const consultar = document.getElementById("prodConsultar").value === "true";
        const patch = {
            nombre: document.getElementById("prodNombre").value.trim(),
            categoria: document.getElementById("prodCategoria").value.trim(),
            bodega: document.getElementById("prodBodega").value.trim() || null,
            precioMayorista: consultar ? null : (Number(document.getElementById("prodMayorista").value) || 0),
            precioMinorista: consultar ? null : (Number(document.getElementById("prodMinorista").value) || 0),
            consultar: consultar,
            stock: Number(document.getElementById("prodStock").value) || 0
        };

        if (idField) {
            const id = Number(idField);
            if (isCustom(id)) {
                const custom = getJSON(CUSTOM_KEY, []);
                const idx = custom.findIndex(p => p.id === id);
                custom[idx] = Object.assign({}, custom[idx], patch);
                setJSON(CUSTOM_KEY, custom);
            } else {
                const overrides = getJSON(OVERRIDES_KEY, {});
                overrides[id] = patch;
                setJSON(OVERRIDES_KEY, overrides);
            }
        } else {
            const custom = getJSON(CUSTOM_KEY, []);
            patch.id = nextCustomId();
            patch.imagen = "img/placeholder-botella.svg";
            custom.push(patch);
            setJSON(CUSTOM_KEY, custom);
        }

        closeModal();
        renderProducts();
        renderCategoryOptions();
    });

    // ===== Pedidos =====
    function renderOrders() {
        const orders = getAllOrders().sort((a, b) => b.fecha.localeCompare(a.fecha));
        document.getElementById("ordersTableBody").innerHTML = orders.length === 0
            ? '<tr><td colspan="7" style="text-align:center; color:#667;">Todavía no hay pedidos.</td></tr>'
            : orders.map(o => {
                const fecha = new Date(o.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
                const itemsSummary = o.items.map(i => i.cantidad + "x " + i.nombre).join(", ");
                return (
                    '<tr>' +
                        '<td>#' + escapeHtml(o.id) + '</td>' +
                        '<td>' + fecha + '</td>' +
                        '<td>' + escapeHtml(o.cliente.nombre) + '<br><small>' + escapeHtml(o.cliente.telefono) + '</small></td>' +
                        '<td>' + (o.modalidad === "mayorista" ? "Mayorista" : "Minorista") + '</td>' +
                        '<td style="max-width:260px;">' + escapeHtml(itemsSummary) + '</td>' +
                        '<td>' + formatCurrency(o.subtotal) + '</td>' +
                        '<td>' +
                            '<select data-order="' + o.id + '" class="filter-select">' +
                                '<option value="pendiente"' + (o.estado === "pendiente" ? " selected" : "") + '>Pendiente</option>' +
                                '<option value="confirmado"' + (o.estado === "confirmado" ? " selected" : "") + '>Confirmado</option>' +
                            '</select>' +
                        '</td>' +
                    '</tr>'
                );
            }).join("");

        document.querySelectorAll("[data-order]").forEach(sel => {
            sel.addEventListener("change", function () {
                updateOrderStatus(this.dataset.order, this.value);
            });
        });
    }

    renderCategoryOptions();
    renderProducts();
})();
