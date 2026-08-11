import { db, doc, setDoc, deleteDoc } from "./firebase-init.js";
import { getAllProducts, invalidateProductCache, escapeHtml, formatCurrency, getCategories } from "./utils.js";
import { getAllOrders, updateOrderStatus } from "./cart.js";
import { requireAdmin } from "./auth.js";
import { initHeader } from "./header.js";

const CATEGORY_IMAGE_MAP = {
    "Fernet": "fernet", "Vodka": "vodka", "Whisky": "whisky", "Espumantes": "espumantes",
    "Licores": "licores", "Aperitivos": "aperitivos", "Cervezas": "cervezas", "Gaseosas": "gaseosas",
    "Gin": "gin", "Ron": "ron", "Cognac": "cognac", "Tequila": "tequila",
    "Vinos": "vinos", "Otros": "otros"
};

function categoryImage(categoria) {
    const slug = CATEGORY_IMAGE_MAP[categoria];
    return slug ? "img/categorias/placeholder-" + slug + ".svg" : "img/placeholder-botella.svg";
}

(async function () {
    await initHeader();

    const admin = await requireAdmin();
    if (!admin) return;

    const ADMIN_PAGE_SIZE = 30;
    let state = { search: "", page: 1 };
    let allProducts = await getAllProducts();
    let customIds = new Set();
    let baseIds = new Set((window.KODA_PRODUCTS || []).map((p) => p.id));

    function refreshIdSets() {
        customIds = new Set(allProducts.filter((p) => !baseIds.has(p.id)).map((p) => p.id));
    }
    refreshIdSets();

    // ===== Tabs =====
    document.querySelectorAll(".admin-tabs button").forEach((btn) => {
        btn.addEventListener("click", function () {
            document.querySelectorAll(".admin-tabs button").forEach((b) => b.classList.remove("active"));
            document.querySelectorAll(".admin-panel").forEach((p) => p.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById(btn.dataset.tab === "productos" ? "panelProductos" : "panelPedidos").classList.add("active");
            if (btn.dataset.tab === "pedidos") renderOrders();
        });
    });

    // ===== Productos =====
    function nextCustomId() {
        return allProducts.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    }

    function priceCell(value, consultar) {
        if (consultar) return '<span class="consultar-tag">Consultar</span>';
        return formatCurrency(value);
    }

    async function renderCategoryOptions() {
        const cats = await getCategories();
        document.getElementById("categoriaOptions").innerHTML = cats.map((c) => '<option value="' + escapeHtml(c.name) + '">').join("");
    }

    function renderProducts() {
        const q = state.search.trim().toLowerCase();
        const all = allProducts.filter((p) => !q || p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q));
        const totalPages = Math.max(1, Math.ceil(all.length / ADMIN_PAGE_SIZE));
        if (state.page > totalPages) state.page = totalPages;
        const start = (state.page - 1) * ADMIN_PAGE_SIZE;
        const pageItems = all.slice(start, start + ADMIN_PAGE_SIZE);

        document.getElementById("productsTableBody").innerHTML = pageItems.map((p) => (
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
        el.querySelectorAll("button[data-page]").forEach((btn) => {
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

    document.getElementById("productsTableBody").addEventListener("click", async function (e) {
        const editBtn = e.target.closest("[data-edit]");
        const delBtn = e.target.closest("[data-delete]");
        if (editBtn) {
            const id = Number(editBtn.dataset.edit);
            openModal(allProducts.find((p) => p.id === id));
        } else if (delBtn) {
            const id = Number(delBtn.dataset.delete);
            if (!confirm("¿Eliminar este producto del catálogo?")) return;
            if (customIds.has(id)) {
                await deleteDoc(doc(db, "productCustom", String(id)));
            } else {
                await setDoc(doc(db, "productDeleted", String(id)), { eliminado: true });
            }
            invalidateProductCache();
            allProducts = await getAllProducts();
            refreshIdSets();
            renderProducts();
            renderCategoryOptions();
        }
    });

    document.getElementById("productForm").addEventListener("submit", async function (e) {
        e.preventDefault();
        const idField = document.getElementById("prodId").value;
        const consultar = document.getElementById("prodConsultar").value === "true";
        const patch = {
            nombre: document.getElementById("prodNombre").value.trim(),
            categoria: document.getElementById("prodCategoria").value.trim(),
            bodega: document.getElementById("prodBodega").value.trim() || null,
            precioMayorista: consultar ? null : (Number(document.getElementById("prodMayorista").value) || 0),
            precioMinorista: consultar ? null : (Number(document.getElementById("prodMinorista").value) || 0),
            consultar,
            stock: Number(document.getElementById("prodStock").value) || 0
        };

        if (idField) {
            const id = Number(idField);
            if (customIds.has(id)) {
                await setDoc(doc(db, "productCustom", String(id)), patch, { merge: true });
            } else {
                await setDoc(doc(db, "productOverrides", String(id)), patch, { merge: true });
            }
        } else {
            const newId = nextCustomId();
            patch.imagen = categoryImage(patch.categoria);
            await setDoc(doc(db, "productCustom", String(newId)), patch);
        }

        invalidateProductCache();
        allProducts = await getAllProducts();
        refreshIdSets();
        closeModal();
        renderProducts();
        renderCategoryOptions();
    });

    // ===== Pedidos =====
    async function renderOrders() {
        const orders = await getAllOrders();
        document.getElementById("ordersTableBody").innerHTML = orders.length === 0
            ? '<tr><td colspan="7" style="text-align:center; color:#667;">Todavía no hay pedidos.</td></tr>'
            : orders.map((o) => {
                const fecha = new Date(o.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
                const itemsSummary = o.items.map((i) => i.cantidad + "x " + i.nombre).join(", ");
                return (
                    '<tr>' +
                        '<td>#' + escapeHtml(o.id) + '</td>' +
                        '<td>' + fecha + '</td>' +
                        '<td>' + escapeHtml(o.cliente.nombre) + '<br><small>' + escapeHtml(o.cliente.telefono) + '</small></td>' +
                        '<td>' + (o.modalidad === "mayorista" ? "Mayorista" : "Minorista") + '</td>' +
                        '<td style="max-width:260px;">' + escapeHtml(itemsSummary) + '</td>' +
                        '<td>' + formatCurrency(o.subtotal) + '</td>' +
                        '<td>' +
                            '<select data-order="' + o.docId + '" class="filter-select">' +
                                '<option value="pendiente"' + (o.estado === "pendiente" ? " selected" : "") + '>Pendiente</option>' +
                                '<option value="confirmado"' + (o.estado === "confirmado" ? " selected" : "") + '>Confirmado</option>' +
                            '</select>' +
                        '</td>' +
                    '</tr>'
                );
            }).join("");

        document.querySelectorAll("[data-order]").forEach((sel) => {
            sel.addEventListener("change", async function () {
                await updateOrderStatus(this.dataset.order, this.value);
            });
        });
    }

    renderCategoryOptions();
    renderProducts();
})();
