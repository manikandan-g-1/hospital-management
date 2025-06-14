const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Session configuration
app.use(session({
  secret: 'hospital_secret_key',
  resave: false,
  saveUninitialized: false
}));

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/hospitalDB')
  .then(() => console.log("MongoDB connected!"))
  .catch(err => console.log(err));

// Models
const User = require('./models/user');
const Patient = require('./models/patient');

// Middleware to protect routes
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/login');
}

// Routes

// Home
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Register
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const existing = await User.findOne({ username });

  if (existing) {
    return res.send('User already exists. Try logging in.');
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashed });
  await user.save();

  res.redirect('/login');
});

// Login
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.render('login', { error: '❌ Invalid username or password' });
  }

  req.session.userId = user._id;
  res.redirect('/dashboard');
});

// Dashboard
app.get('/dashboard', isAuthenticated, async (req, res) => {
  const patients = await Patient.find();
  res.render('dashboard', { patients });
});

// Add patient
app.get('/add', isAuthenticated, (req, res) => {
  res.render('add');
});

app.post('/add', isAuthenticated, async (req, res) => {
  const { sno, name, disease, doctor, room } = req.body;
  const patient = new Patient({ sno, name, disease, doctor, room });
  await patient.save();
  res.redirect('/dashboard');
});

// Edit patient
app.get('/edit/:id', isAuthenticated, async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  res.render('edit', { patient });
});

app.post('/edit/:id', isAuthenticated, async (req, res) => {
  const { sno, name, disease, doctor, room } = req.body;
  await Patient.findByIdAndUpdate(req.params.id, { sno, name, disease, doctor, room });
  res.redirect('/dashboard');
});

// Delete patient
app.get('/delete/:id', isAuthenticated, async (req, res) => {
  await Patient.findByIdAndDelete(req.params.id);
  res.redirect('/dashboard');
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Server
app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
