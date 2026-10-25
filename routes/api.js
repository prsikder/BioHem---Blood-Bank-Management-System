// routes/api.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { ensureAdmin, ensureAuth } = require('../middleware/auth');

// Get hospital locations for map (Admin only)
router.get('/hospitals/locations', ensureAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, city, address, latitude, longitude, created_at 
       FROM hospitals 
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL
       ORDER BY name`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching hospital locations:', err);
    res.status(500).json({ error: 'Failed to fetch hospital locations' });
  }
});

// Get hospital statistics (Admin only)
router.get('/hospitals/stats', ensureAdmin, async (req, res) => {
  try {
    const [totalHospitals] = await pool.query('SELECT COUNT(*) as total FROM hospitals');
    const [hospitalsWithLocation] = await pool.query(
      'SELECT COUNT(*) as count FROM hospitals WHERE latitude IS NOT NULL AND longitude IS NOT NULL'
    );
    const [recentHospitals] = await pool.query(
      'SELECT COUNT(*) as count FROM hospitals WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
    );
    
    res.json({
      total: totalHospitals[0].total,
      withLocation: hospitalsWithLocation[0].count,
      withoutLocation: totalHospitals[0].total - hospitalsWithLocation[0].count,
      recent: recentHospitals[0].count
    });
  } catch (err) {
    console.error('Error fetching hospital stats:', err);
    res.status(500).json({ error: 'Failed to fetch hospital statistics' });
  }
});

module.exports = router;