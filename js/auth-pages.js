(function () {
    function getNextParam() {
        const params = new URLSearchParams(location.search);
        return params.get("next") || "index.html";
    }

    // ===== LOGIN =====
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value.trim();
            const password = document.getElementById("loginPassword").value;
            const result = loginUser(email, password);
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
        registerForm.addEventListener("submit", function (e) {
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

            const result = registerUser({
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
        let currentEmail = "";
        requestCodeForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const alertBox = document.getElementById("recoverAlert");
            const infoBox = document.getElementById("recoverInfo");
            alertBox.style.display = "none";
            const email = document.getElementById("recEmail").value.trim();
            const result = requestPasswordReset(email);
            if (!result.ok) {
                alertBox.textContent = result.error;
                alertBox.style.display = "block";
                return;
            }
            currentEmail = email;
            infoBox.textContent = "Como no tenemos servidor de emails, este es tu código de recuperación: " + result.code + " (válido 15 minutos).";
            infoBox.style.display = "block";
            document.getElementById("resetPasswordForm").style.display = "block";
        });

        document.getElementById("resetPasswordForm").addEventListener("submit", function (e) {
            e.preventDefault();
            const alertBox = document.getElementById("recoverAlert");
            const code = document.getElementById("recCode").value.trim();
            const newPassword = document.getElementById("recNewPassword").value;
            const result = confirmPasswordReset(currentEmail, code, newPassword);
            if (!result.ok) {
                alertBox.textContent = result.error;
                alertBox.style.display = "block";
                return;
            }
            alertBox.style.display = "none";
            document.getElementById("recoverInfo").className = "alert alert-success";
            document.getElementById("recoverInfo").textContent = "¡Contraseña actualizada! Ya podés ingresar con tu nueva contraseña.";
            document.getElementById("resetPasswordForm").style.display = "none";
            requestCodeForm.style.display = "none";
        });
    }
})();
