// routes/auth.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const upload = require('../middleware/upload'); // multer upload

// show login
router.get('/login', (req, res) => res.render('auth/login'));

// donor registration form
router.get('/register/donor', (req, res) => res.render('auth/register-donor'));

// hospital registration form
router.get('/register/hospital', (req, res) => res.render('auth/register-hospital'));

// donor registration (with photo)
router.post('/register/donor', upload.single('photo'), async (req, res, next) => {
  try {
    const { name, email, password, phone, blood_group, city } = req.body;
    // new fields
    const age = req.body.age ? Number(req.body.age) : null;
    const lastDonation = req.body.last_donation_date ? req.body.last_donation_date : null;

    if (!name || !email || !password) {
      req.flash('error', 'Name, email and password required');
      return res.redirect('/auth/register/donor');
    }

    // age validation: if provided must be >= 18
    if (age !== null && age < 18) {
      req.flash('error', 'Donor must be at least 18 years old');
      return res.redirect('/auth/register/donor');
    }

    const hashed = await bcrypt.hash(password, 10);
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

    // Insert into donors
    const [dRes] = await pool.query(
      'INSERT INTO donors (name,email,phone,blood_group,city,photo,age,last_donation_date,created_at) VALUES (?,?,?,?,?,?,?,?,NOW())',
      [name, email, phone || '', (blood_group || '').toUpperCase(), city || '', photoPath, age, lastDonation]
    );
    const donorId = dRes.insertId;

    // Create user account linked to donor
    await pool.query(
      'INSERT INTO users (name,email,password,role,donor_id,created_at) VALUES (?,?,?,?,?,NOW())',
      [name, email, hashed, 'donor', donorId]
    );

    req.flash('success', 'Registration successful. Please login.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error('Register donor error', err);
    if (err && err.code === 'ER_DUP_ENTRY') {
      req.flash('error', 'Email already registered');
      return res.redirect('/auth/register/donor');
    }
    next(err);
  }
});

// hospital registration (unchanged)
router.post('/register/hospital', async (req, res, next) => {
  try {
    const { name, email, password, phone, city, address } = req.body;
    if (!name || !email || !password) {
      req.flash('error', 'Name, email and password required');
      return res.redirect('/auth/register/hospital');
    }
    const hashed = await bcrypt.hash(password, 10);
    const [hRes] = await pool.query(
      'INSERT INTO hospitals (name,email,phone,city,address,created_at) VALUES (?,?,?,?,?,NOW())',
      [name, email, phone || '', city || '', address || '']
    );
    const hospitalId = hRes.insertId;
    await pool.query(
      'INSERT INTO users (name,email,password,role,hospital_id,created_at) VALUES (?,?,?,?,?,NOW())',
      [name, email, hashed, 'staff', hospitalId]
    );
    req.flash('success', 'Hospital account created. Please login.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error('Register hospital error', err);
    if (err && err.code === 'ER_DUP_ENTRY') {
      req.flash('error', 'Email already registered');
      return res.redirect('/auth/register/hospital');
    }
    next(err);
  }
});

// login (unchanged)
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      req.flash('error', 'Email and password required');
      return res.redirect('/auth/login');
    }
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) { req.flash('error', 'Invalid credentials'); return res.redirect('/auth/login'); }
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) { req.flash('error', 'Invalid credentials'); return res.redirect('/auth/login'); }

    const role = user.role || user.user_type || 'staff';
    req.session.user = {
      id: user.id,
      email: user.email,
      role,
      name: user.name,
      donor_id: user.donor_id || null,
      hospital_id: user.hospital_id || null
    };

    req.flash('success', 'Welcome back');
    if (role === 'admin') return res.redirect('/admin');
    if (role === 'donor' && req.session.user.donor_id) return res.redirect('/donors/' + req.session.user.donor_id);
    if ((role === 'staff' || role === 'hospital') && req.session.user.hospital_id) {
        return res.redirect('/hospitals/dashboard'); // Changed from /hospitals/:id
    }
    return res.redirect('/');
  } catch (err) { next(err); }
});

// logout route
router.get('/logout', (req, res) => {
  // destroy session on server
  req.session.destroy(err => {
    // clear cookie in browser (name depends on your session config; default is connect.sid)
    res.clearCookie('connect.sid', { path: '/' });
    // always redirect to a safe public page
    return res.redirect('/');
  });
});


module.exports = router;
