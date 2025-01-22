const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose'); // Import Mongoose
const bcrypt = require('bcrypt'); // For password hashing
const path = require('path'); // Ensure you import path for serving files

const app = express();
const PORT = 3000;

// Replace with your actual connection string
const uri = 'mongodb+srv://devang-p12:Devang%401203@canteencluster.tetyg.mongodb.net/?retryWrites=true&w=majority&appName=CanteenCluster';

// Connect to MongoDB using Mongoose
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch(err => {
        console.error("Could not connect to MongoDB", err);
    });

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Define User schema and model
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'user' } // Default role is 'user'
});

const User = mongoose.model('User', userSchema);

// Define Order schema and model
const orderSchema = new mongoose.Schema({
    customerName: String,
    items: Array,
    total: Number,
    status: { type: String, default: 'Pending' }
});

const Order = mongoose.model('Order', orderSchema);


// Serve the homepage (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// User Signup endpoint
app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.send('<h1>Email already registered!</h1><a href="/signup.html">Try again</a>');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        console.log('New user registered:', { name, email });
        res.redirect('/login.html');
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).send('<h1>Error registering user</h1><a href="/signup.html">Try again</a>');
    }
});

// Admin Signup endpoint
app.post('/admin-signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            return res.send('<h1>Email already registered!</h1><a href="/admin-signup.html">Try again</a>');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new User({ name, email, password: hashedPassword, role: 'admin' });
        await newAdmin.save();

        console.log('New admin registered:', { name, email });
        res.redirect('/login.html');
    } catch (error) {
        console.error('Error during admin signup:', error);
        res.status(500).send('<h1>Error registering admin</h1><a href="/admin-signup.html">Try again</a>');
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user) {
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                if (user.role === 'user') {
                    res.send(`
                        <script>
                            sessionStorage.setItem('loggedIn', 'true');
                            sessionStorage.setItem('isAdmin', 'false');
                            window.location.href = '/index.html';
                        </script>
                    `);
                } else if (user.role === 'admin') {
                    res.send(`
                        <script>
                            sessionStorage.setItem('loggedIn', 'true');
                            sessionStorage.setItem('isAdmin', 'true');
                            window.location.href = '/index.html'; // Redirect to index.html
                        </script>
                    `);
                }
            } else {
                res.send('<h1>Invalid Credentials</h1><a href="/login.html">Go back</a>');
            }
        } else {
            res.send('<h1>Invalid Credentials</h1><a href="/login.html">Go back</a>');
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('<h1>Error logging in</h1><a href="/login.html">Try again</a>');
    }
});

// Endpoint to handle new orders
app.post('/orders', async (req, res) => {
    const orderData = req.body;

    const order = new Order(orderData);

    try {
        await order.save();
        console.log('New order received:', order);
        res.status(201).send(order);
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).send('Error saving order');
    }
});

// Endpoint to get all orders for admin panel
app.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders); // Respond with JSON data of orders
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Error fetching orders');
    }
});

// Endpoint to update an order status
app.patch('/orders/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const updatedOrder = await Order.findOneAndUpdate(
            { _id: id }, // Use MongoDB's _id field for updating
            { status: 'Done' },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).send('Order not found');
        }

        res.json(updatedOrder); // Respond with updated order details
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).send('Error updating order');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
