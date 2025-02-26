const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = 3000;

const uri = 'mongodb+srv://devang-p12:Devang%401203@canteencluster.tetyg.mongodb.net/?retryWrites=true&w=majority&appName=CanteenCluster';

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch(err => {
        console.error("Could not connect to MongoDB", err);
    });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname));

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'user' }
});

const User = mongoose.model('User', userSchema);

const orderSchema = new mongoose.Schema({
    orderId: { type: String, unique: true },
    customerName: { type: String, required: true },
    items: { type: Array, required: true },
    total: { type: Number, required: true },
    status: { type: String, default: 'Pending' }
});

const Order = mongoose.model('Order', orderSchema);

// Define Counter schema and model
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Order;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

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
                            window.location.href = '/index.html';
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

// Function to initialize the counter
async function initCounter() {
    try {
        const counterDoc = await Counter.findOne({ _id: 'orderId' });
        if (!counterDoc) {
            const newCounterDoc = new Counter({ _id: 'orderId', seq: 0 });
            await newCounterDoc.save();
            console.log('New counter document created');
        }
    } catch (error) {
        console.error('Error initializing counter:', error);
    }
}

// Initialize the counter when the server starts
initCounter();

// Endpoint to handle new orders
app.post('/orders', async (req, res) => {
    const orderData = req.body;

    try {
        // Find and update the counter
        const counter = await Counter.findByIdAndUpdate(
            { _id: 'orderId' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true } // Create if it doesn't exist
        );

        // Create a new order with the generated order ID
        const order = new Order({
            ...orderData,
            orderId: counter.seq.toString()  // Use the updated counter value
        });

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
        const orders = await Order.find().sort({ orderId: 1 }); // Sort by orderId (ascending)
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

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

        res.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).send('Error updating order');
    }
});

app.get('/orders/estimated-time', async (req, res) => {
    try {
        const pendingOrdersCount = await Order.countDocuments({ status: 'Pending' });
        const avgPreparationTime = 10; // minutes
        const estimatedTime = pendingOrdersCount * avgPreparationTime;

        res.status(200).json({ estimatedTime, pendingOrdersCount });
    } catch (error) {
        console.error('Error calculating estimated time:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/orders', async (req, res) => {
    console.log("Received DELETE request for clearing orders"); // Debug log
    try {
        const result = await Order.deleteMany({});
        await Counter.findOneAndUpdate({ _id: 'orderId' }, { $set: { seq: 0 } }, { upsert: true });
        console.log(`Deleted ${result.deletedCount} orders and reset the counter`);
        res.status(200).send({ message: `Deleted ${result.deletedCount} orders and reset the counter` });
    } catch (error) {
        console.error('Error deleting orders:', error);
        res.status(500).send({ message: 'Error deleting orders' });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
