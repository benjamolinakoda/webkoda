import { setMode } from "./cart.js";
import { initHeader } from "./header.js";
import { getCategories, categoryImage, escapeHtml } from "./utils.js";

(async function () {
    await initHeader();

    ["verMayoristaBtn", "verMayoristaBtnCta"].forEach((id) => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener("click", () => setMode("mayorista"));
    });

    const grid = document.getElementById("categoryGrid");
    if (grid) {
        const categories = await getCategories();
        grid.innerHTML = categories.map((c) => (
            '<a class="category-card" href="catalogo.html?cat=' + encodeURIComponent(c.name) + '">' +
                '<img src="' + categoryImage(c.name) + '" alt="' + escapeHtml(c.name) + '" loading="lazy">' +
                '<span class="name">' + escapeHtml(c.name) + '</span>' +
                '<span class="count">' + c.count + ' producto' + (c.count === 1 ? "" : "s") + '</span>' +
            '</a>'
        )).join("");
    }
})();
