const API_BASE_URL = "http://parking-system-production.up.railway.app"; // ✅ Updated Backend URL

document.addEventListener("DOMContentLoaded", () => {
    const loginSection = document.getElementById("loginSection");
    const registerSection = document.getElementById("registerSection");
    const loginForm = document.getElementById("loginForm");
    const adminLoginForm = document.getElementById("adminLoginForm");
    const registerForm = document.getElementById("registerForm");
    const addSlotForm = document.getElementById("addSlotForm");

    // ✅ Function to Show Messages on Page
    function showMessage(message, type = "success") {
        const messageBox = document.getElementById("messageBox");
        messageBox.innerText = message;
        messageBox.className = `message-box ${type}-message`;
        messageBox.style.display = "block";

        setTimeout(() => {
            messageBox.style.display = "none";
        }, 3000);
    }

    // ✅ Toggle Login/Register Sections
    document.getElementById("showRegister")?.addEventListener("click", (event) => {
        event.preventDefault();
        loginSection.style.display = "none";
        registerSection.style.display = "block";
    });

    document.getElementById("showLogin")?.addEventListener("click", (event) => {
        event.preventDefault();
        registerSection.style.display = "none";
        loginSection.style.display = "block";
    });

    // ✅ User Login
    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const username = document.getElementById("loginUsername").value.trim();
            const password = document.getElementById("loginPassword").value.trim();

            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();
                if (data.success) {
                    localStorage.setItem("user_id", data.user_id);
                    localStorage.setItem("username", username);
                    localStorage.setItem("token", data.token);
                    showMessage("Login successful!", "success");
                    setTimeout(() => (window.location.href = "dashboard.html"), 1500);
                } else {
                    showMessage(data.message || "Invalid login credentials.", "error");
                }
            } catch (error) {
                showMessage("Error logging in. Please try again.", "error");
            }
        });
    }

    // ✅ Admin Login
    if (adminLoginForm) {
        adminLoginForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const username = document.getElementById("adminUsername").value.trim();
            const password = document.getElementById("adminPassword").value.trim();

            try {
                const response = await fetch(`${API_BASE_URL}/admin/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();
                if (data.success) {
                    localStorage.setItem("admin_token", data.token);
                    showMessage("Admin login successful!", "success");
                    setTimeout(() => (window.location.href = "admin.html"), 1500);
                } else {
                    showMessage(data.message || "Admin login failed.", "error");
                }
            } catch (error) {
                showMessage("Error logging in as admin. Please try again.", "error");
            }
        });
    }

    // ✅ User Registration
    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const username = document.getElementById("registerUsername").value.trim();
            const password = document.getElementById("registerPassword").value.trim();

            try {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();
                if (data.success) {
                    showMessage("Registration successful! You can now log in.", "success");
                    setTimeout(() => {
                        registerSection.style.display = "none";
                        loginSection.style.display = "block";
                    }, 1500);
                } else {
                    showMessage(data.message || "Registration failed. Try again.", "error");
                }
            } catch (error) {
                showMessage("Error registering. Please try again.", "error");
            }
        });
    }

    // ✅ Add Parking Slot (Admin Only)
    if (addSlotForm) {
        addSlotForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            const slotNumber = document.getElementById("slotNumber").value.trim();
            const token = localStorage.getItem("admin_token");

            if (!token) {
                showMessage("Unauthorized! Please log in as admin.", "error");
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/slots`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ slot_number: slotNumber })
                });

                const data = await response.json();
                if (data.success) {
                    showMessage("Slot added successfully!", "success");
                    document.getElementById("slotNumber").value = "";
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showMessage(data.message || "Failed to add slot.", "error");
                }
            } catch (error) {
                showMessage("Error adding slot. Please try again.", "error");
            }
        });
    }
});

if (data.success) {
    localStorage.setItem("token", data.token); // ✅ Ensure token is saved
    localStorage.setItem("user_id", data.user_id);
    alert("Login successful!");
    window.location.href = "dashboard.html";
} else {
    alert(data.message || "Invalid login credentials.");
}
