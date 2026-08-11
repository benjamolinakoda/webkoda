(function () {
    var KEY = "koda_age_verified";
    var gate = document.getElementById("ageGate");
    if (!gate) return;

    if (localStorage.getItem(KEY) === "yes") {
        gate.classList.add("hidden");
        return;
    }

    document.documentElement.style.overflow = "hidden";

    document.getElementById("ageGateYes").addEventListener("click", function () {
        localStorage.setItem(KEY, "yes");
        gate.classList.add("hidden");
        document.documentElement.style.overflow = "";
    });

    document.getElementById("ageGateNo").addEventListener("click", function () {
        location.href = "https://www.google.com";
    });
})();
