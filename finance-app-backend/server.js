const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect('mongodb://localhost:27017/financeApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// User Schema and Model
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  username: { type: String, unique: true, sparse: true }, // Optional unique username
});

const User = mongoose.model('User', userSchema);

// Transaction Schema and Model
const transactionSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  category: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'No token provided' });

  jwt.verify(token, 'secretkey', (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Failed to authenticate token' });
    req.userId = decoded.id;
    next();
  });
};

// Registration Route
app.post('/register', async (req, res) => {
  const { email, password, username } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = new User({ email, password: hashedPassword, username });
    await user.save();
    res.status(200).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to register user' });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ error: 'User not found' });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

  const token = jwt.sign({ id: user._id }, 'secretkey', { expiresIn: '1h' });
  res.status(200).json({ token });
});

// Add Transaction Route
app.post('/add-transaction', verifyToken, async (req, res) => {
  const { description, amount, category } = req.body;
  const newTransaction = new Transaction({ description, amount, category, userId: req.userId });

  try {
    await newTransaction.save();
    res.status(200).json({ message: 'Transaction added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

// Get Transactions Route
app.get('/transactions', verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId });
    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
