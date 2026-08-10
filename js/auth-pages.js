import { registerUser, loginUser, requestPasswordReset } from "./auth.js";
import { initHeader } from "./header.js";

(async function () {
    await initHeader();

    function getNextParam() {
        const params = new URLSearchParams(location.search);
        return params.get("next") || "index.html";
    }

    // ===== LOGIN =====
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value.trim();
            const password = document.getElementById("loginPassword").value;
            const result = await loginUser(email, password);
            const alertBox = document.getElementById("loginAlert");
            if (!result.ok) {
                alertBox.textContent = result.error;
                alertBox.style.display = "block";
                return;
            }
            location.href = getNextParam();
        });
    }

    // ===== REGISTRO =====
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const alertBox = document.getElementById("registerAlert");
            const pass1 = document.getElementById("regPassword");
            const pass2 = document.getElementById("regPassword2");

            let valid = true;
            if (pass1.value.length < 6) {
                pass1.closest(".form-group").classList.add("invalid");
                valid = false;
            } else {
                pass1.closest(".form-group").classList.remove("invalid");
            }
            if (pass2.value !== pass1.value || !pass2.value) {
                pass2.closest(".form-group").classList.add("invalid");
                valid = false;
            } else {
                pass2.closest(".form-group").classList.remove("invalid");
            }
            if (!valid) return;

            const result = await registerUser({
                nombre: document.getElementById("regNombre").value,
                email: document.getElementById("regEmail").value,
                telefono: document.getElementById("regTelefono").value,
                direccion: document.getElementById("regDireccion").value,
                password: pass1.value
            });

            if (!result.ok) {
                alertBox.textContent = result.error;
                alertBox.style.display = "block";
                return;
            }
            location.href = getNextParam();
        });
    }

    // ===== RECUPERAR CONTRASEÑA =====
    const requestCodeForm = document.getElementById("requestCodeForm");
    if (requestCodeForm) {
        requestCodeForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const alertBox = document.getElementById("recoverAlert");
            const infoBox = document.getElementById("recoverInfo");
            alertBox.style.display = "none";
            const email = document.getElementById("recEmail").value.trim();
            const result = await requestPasswordReset(email);
            if (!result.ok) {
                alertBox.textContent = result.error;
                alertBox.style.display = "block";
                return;
            }
            infoBox.textContent = "Te enviamos un email a " + email + " con un link para restablecer tu contraseña. Revisá tu bandeja de entrada (y spam).";
            infoBox.style.display = "block";
            requestCodeForm.querySelector("button").disabled = true;
        });
    }
})();
