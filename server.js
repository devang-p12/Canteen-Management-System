const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files directly from the root directory (Canteen Management folder)
app.use(express.static(__dirname));

// Serve the homepage (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// In-memory user credentials
const users = [
    { email: 'user@example.com', password: 'user123', role: 'user' },
    { username: 'admin', password: 'admin123', role: 'admin' }
];

// Handle Login
// Handle Login
app.post('/login', (req, res) => {
    const { email, password, username } = req.body;

    const user = users.find(
        u => u.email === email && u.password === password && u.role === 'user'
    );
    const admin = users.find(
        a => a.username === username && a.password === password && a.role === 'admin'
    );

    if (user) {
        // User login logic
        res.send(`
            <script>
                sessionStorage.setItem('loggedIn', 'true');
                window.location.href = '/index.html';
            </script>
        `);
    } else if (admin) {
        // Admin login logic
        res.send(`
            <script>
                sessionStorage.setItem('loggedIn', 'true');
                sessionStorage.setItem('isAdmin', 'true');
                window.location.href = '/index.html';
            </script>
        `);
    } else {
        res.send('<h1>Invalid Credentials</h1><a href="/login.html">Go back</a>');
    }
});




// Handle Sign-Up
app.post('/signup', (req, res) => {
    const { name, email, password } = req.body;

    // Check if email already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.send('<h1>Email already registered!</h1><a href="/signup.html">Try again</a>');
    }

    // Add new user to the users list
    users.push({ name, email, password, role: 'user' });
    console.log('New user registered:', { name, email });

    // Redirect to login page
    res.redirect('/login.html');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
