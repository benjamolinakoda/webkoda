import { setMode } from "./cart.js";
import { initHeader } from "./header.js";

(async function () {
    await initHeader();
    const btn = document.getElementById("verMayoristaBtn");
    if (btn) btn.addEventListener("click", () => setMode("mayorista"));
})();
