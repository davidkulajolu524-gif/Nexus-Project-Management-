const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const resetForm = document.getElementById("resetForm");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authMessage = document.getElementById("authMessage");

function getPasswordStrength(password) {
    return [
        password.length >= 12,
        /[a-z]/.test(password),
        /[A-Z]/.test(password),
        /\d/.test(password),
        /[^A-Za-z0-9]/.test(password)
    ].filter(Boolean).length;
}

function updatePasswordStrength(inputId, barId, textId) {
    const password = document.getElementById(inputId).value;
    const score = getPasswordStrength(password);
    const bar = document.getElementById(barId);
    const text = document.getElementById(textId);
    const labels = ["", "Very weak", "Weak", "Fair", "Good", "Strong"];

    bar.style.width = `${score * 20}%`;
    bar.dataset.score = score;
    text.textContent = password ? labels[score] : "Use 12+ characters with upper/lowercase letters, a number, and a symbol.";
}

function showMessage(message, type = "") {
    authMessage.textContent = message;
    authMessage.className = `auth-message ${type}`;
}

function setMode(mode) {
    const isRegister = mode === "register";
    loginForm.classList.toggle("hidden", isRegister || mode === "reset");
    registerForm.classList.toggle("hidden", !isRegister);
    resetForm.classList.toggle("hidden", mode !== "reset");
    document.querySelectorAll(".auth-tab").forEach(tab => {
        tab.classList.toggle("active", tab.dataset.mode === mode);
    });
    authTitle.textContent = mode === "register" ? "Create your account" : mode === "reset" ? "Reset your password" : "Welcome back";
    authSubtitle.textContent = mode === "register" ? "Start organizing your work in Nexus." : mode === "reset" ? "Choose a new password for your account." : "Sign in to open your workspace.";
    showMessage("");
}

async function submitAuth(endpoint, payload) {
    const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || "Something went wrong.");
    return data;
}

loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    try {
        await submitAuth("/auth/login", {
            email: document.getElementById("loginEmail").value,
            password: document.getElementById("loginPassword").value
        });
        window.location.href = "/dashboard";
    } catch (error) {
        showMessage(error.message, "error");
    }
});

registerForm.addEventListener("submit", async event => {
    event.preventDefault();
    const registerPassword = document.getElementById("registerPassword").value;
    if (getPasswordStrength(registerPassword) < 5) {
        showMessage("Choose a stronger password before continuing.", "error");
        return;
    }
    try {
        await submitAuth("/auth/register", {
            name: document.getElementById("registerName").value,
            email: document.getElementById("registerEmail").value,
            password: registerPassword
        });
        window.location.href = "/dashboard";
    } catch (error) {
        showMessage(error.message, "error");
    }
});

document.getElementById("registerPassword").addEventListener("input", () => {
    updatePasswordStrength("registerPassword", "registerStrengthBar", "registerStrengthText");
});

document.getElementById("resetPassword").addEventListener("input", () => {
    updatePasswordStrength("resetPassword", "resetStrengthBar", "resetStrengthText");
});

resetForm.addEventListener("submit", async event => {
    event.preventDefault();
    const resetPassword = document.getElementById("resetPassword").value;
    if (getPasswordStrength(resetPassword) < 5) {
        showMessage("Choose a stronger password before continuing.", "error");
        return;
    }
    try {
        const data = await submitAuth("/auth/forgot-password", {
            email: document.getElementById("resetEmail").value,
            password: resetPassword
        });
        setMode("login");
        showMessage(data.message, "success");
    } catch (error) {
        showMessage(error.message, "error");
    }
});

document.querySelectorAll(".auth-tab").forEach(tab => {
    tab.addEventListener("click", () => setMode(tab.dataset.mode));
});

document.getElementById("forgotLink").addEventListener("click", () => setMode("reset"));
document.getElementById("backToLogin").addEventListener("click", () => setMode("login"));
