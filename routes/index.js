// routes/index.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// public landing (BioHem BD)
router.get('/', async (req, res, next) => {
  try {
    // if logged-in, optionally show quick counts on landing
    let donors = 0, hospitals = 0, stock = 0;
    try {
      const [d] = await pool.query('SELECT COUNT(*) AS donors FROM donors');
      const [h] = await pool.query('SELECT COUNT(*) AS hospitals FROM hospitals');
      const [s] = await pool.query('SELECT COALESCE(SUM(units),0) AS stock FROM blood_stock');
      donors = d?.[0]?.donors || 0;
      hospitals = h?.[0]?.hospitals || 0;
      stock = s?.[0]?.stock || 0;
    } catch (e) {
      // ignore DB errors for landing page (still show about content)
    }
    res.render('index', { donors, hospitals, stock });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
