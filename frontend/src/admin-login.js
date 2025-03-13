// Admin Login Script
document.getElementById("adminLoginForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Verify credentials
    if (username === "ADMIN" && password === "4325") {
        // Redirect to admin dashboard
        window.location.href = "./admin-dashboard.html";
    } else {
        // Show error message
        const errorMessage = document.getElementById("errorMessage");
        errorMessage.textContent = "Invalid username or password.";
    }
});
