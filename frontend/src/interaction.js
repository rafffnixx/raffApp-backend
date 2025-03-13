// Handle Login
document.querySelector('#loginForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value.trim(); // Fetch username input
    const password = document.getElementById('password').value.trim(); // Fetch password input
    const loginMessage = document.getElementById('loginMessage'); // Fetch login message element

    if (!username || !password) {
        alert('Both username and password are required!');
        return;
    }

    loginMessage.textContent = 'Logging in...';
    loginMessage.style.color = 'black';

    try {
        // Perform login
        const result = await loginUser(username, password);

        // Debugging: Log the backend response
        console.log("Login response from backend:", result);

        // Store token and username in localStorage
        localStorage.setItem('token', result.token); // Save the token
        localStorage.setItem('username', result.username); // Save the username from backend response

        // Debugging: Log the username being saved
        console.log("Logged in user:", result.username);

        alert('Login successful!');
        window.location.href = 'home.html'; // Redirect to the home page
    } catch (error) {
        const errorMessage = error.response?.data?.error || 'Login failed! Please try again.';
        loginMessage.textContent = `Error: ${errorMessage}`;
        loginMessage.style.color = 'red';
    }
});
