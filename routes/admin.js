// routes/admin.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { ensureAdmin } = require('../middleware/auth');

/**
 * Admin dashboard - SIMPLIFIED VERSION
 */
router.get('/', ensureAdmin, async (req, res, next) => {
  try {
    // basic counts
    const [[{ donors }]] = await pool.query('SELECT COUNT(*) AS donors FROM donors');
    const [[{ hospitals }]] = await pool.query('SELECT COUNT(*) AS hospitals FROM hospitals');
    const [[{ users }]] = await pool.query('SELECT COUNT(*) AS users FROM users');

    // inventory
    const [stockRows] = await pool.query('SELECT blood_group, units FROM blood_stock ORDER BY blood_group');
    const totalStockUnits = stockRows.reduce((s, r) => s + (Number(r.units) || 0), 0);
    const [lowStock] = await pool.query('SELECT blood_group, units FROM blood_stock WHERE units <= 2 ORDER BY units ASC');

    // pending requests (list) - include urgency field
    const [requests] = await pool.query(
      `SELECT r.*, h.name AS hospital_name 
       FROM requests r 
       LEFT JOIN hospitals h ON r.hospital_id = h.id 
       WHERE r.status = 'pending'
       ORDER BY 
         CASE WHEN r.urgency = 'Emergency' THEN 1 ELSE 2 END,
         r.created_at DESC`
    );

    res.render('admin/dashboard', {
      donors: donors || 0,
      hospitals: hospitals || 0,
      users: users || 0,
      stockRows,
      totalStockUnits,
      lowStock,
      requests
    });

  } catch (err) {
    next(err);
  }
});

/**
 * Add stock to inventory
 */
router.post('/add-stock', ensureAdmin, async (req, res, next) => {
  try {
    const { blood_group, units } = req.body;
    const addUnits = Math.max(1, parseInt(units) || 1);
    
    // Update stock
    const [stockRows] = await pool.query('SELECT * FROM blood_stock WHERE blood_group = ?', [blood_group]);
    
    if (stockRows.length) {
      await pool.query('UPDATE blood_stock SET units = units + ? WHERE blood_group = ?', [addUnits, blood_group]);
    } else {
      await pool.query('INSERT INTO blood_stock (blood_group, units) VALUES (?, ?)', [blood_group, addUnits]);
    }
    
    // Log the action
    await pool.query('INSERT INTO audit_logs (actor, action, details) VALUES (?, ?, ?)', [
      req.session.user?.email || 'admin',
      'add_stock',
      `Added ${addUnits} units of ${blood_group} to inventory`
    ]);
    
    req.flash('success', `Added ${addUnits} units of ${blood_group} to inventory`);
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
});

/**
 * Export stock CSV
 */
router.get('/stock-export', ensureAdmin, async (req, res, next) => {
  try {
    const [stockRows] = await pool.query('SELECT blood_group, units FROM blood_stock ORDER BY blood_group');
    
    // Convert to CSV
    let csv = 'Blood Group,Units\n';
    stockRows.forEach(row => {
      csv += `${row.blood_group},${row.units}\n`;
    });
    
    res.header('Content-Type', 'text/csv');
    res.attachment('blood-stock.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

/**
 * Fulfill request (atomic)
 */
router.post('/requests/:id/fulfill', ensureAdmin, async (req, res, next) => {
  const id = Number(req.params.id);
  const io = req.app.get('io');
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [reqRows] = await conn.query('SELECT * FROM requests WHERE id = ? FOR UPDATE', [id]);
    if (!reqRows.length) {
      await conn.rollback();
      req.flash('error', 'Request not found');
      return res.redirect('/admin');
    }
    const r = reqRows[0];
    if (r.status !== 'pending') {
      await conn.rollback();
      req.flash('error', 'Request not pending');
      return res.redirect('/admin');
    }

    const [stockRows] = await conn.query('SELECT * FROM blood_stock WHERE blood_group = ? FOR UPDATE', [r.blood_group]);

    if (!stockRows.length || stockRows[0].units < r.units) {
      await conn.rollback();
      req.flash('error', 'Insufficient stock');
      return res.redirect('/admin');
    }

    await conn.query('UPDATE blood_stock SET units = units - ? WHERE blood_group = ?', [r.units, r.blood_group]);
    await conn.query('UPDATE requests SET status = ? WHERE id = ?', ['fulfilled', id]);
    await conn.query('INSERT INTO audit_logs (actor, action, details) VALUES (?, ?, ?)', [
      req.session.user?.email || 'admin',
      'fulfilled_request',
      `Request ${id} (${r.urgency}) for ${r.units} units of ${r.blood_group} fulfilled by ${req.session.user?.email || 'admin'}`
    ]);

    await conn.commit();

    if (io) io.emit('stockUpdated', { blood_group: r.blood_group });

    req.flash('success', `Request #${id} fulfilled and stock updated`);
    return res.redirect('/admin');
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (e) { console.error('rollback failed', e); }
    }
    next(err);
  } finally {
    if (conn) try { conn.release(); } catch (e) { /* ignore */ }
  }
});

/**
 * Reject request
 */
router.post('/requests/:id/reject', ensureAdmin, async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    const [reqRow] = await pool.query('SELECT * FROM requests WHERE id = ?', [id]);
    if (reqRow.length) {
      const r = reqRow[0];
      await pool.query('UPDATE requests SET status = ? WHERE id = ?', ['rejected', id]);
      await pool.query('INSERT INTO audit_logs (actor, action, details) VALUES (?, ?, ?)', [
        req.session.user?.email || 'admin',
        'rejected_request',
        `Request ${id} (${r.urgency}) for ${r.units} units of ${r.blood_group} rejected by ${req.session.user?.email || 'admin'}`
      ]);
    }
    req.flash('success', 'Request rejected');
    res.redirect('/admin');
  } catch (err) {
    next(err);
  }
});

/**
 * Hospital locations API endpoint for map
 */
router.get('/hospitals/locations', ensureAdmin, async (req, res, next) => {
  try {
    const [hospitals] = await pool.query(
      `SELECT id, name, city, phone, email, latitude, longitude 
       FROM hospitals 
       ORDER BY name`
    );
    res.json(hospitals);
  } catch (err) {
    next(err);
  }
});

/**
 * Admin logs
 */
router.get('/logs', ensureAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500');
    res.render('admin/logs', { logs: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * Delete donor (admin only)
 */
router.post('/donors/:id/delete', ensureAdmin, async (req, res, next) => {
  try {
    const donorId = req.params.id;
    await pool.query('DELETE FROM donors WHERE id = ?', [donorId]);
    await pool.query('UPDATE users SET donor_id = NULL WHERE donor_id = ?', [donorId]);
    await pool.query('INSERT INTO audit_logs (actor, action, details) VALUES (?, ?, ?)', [
      req.session.user?.email || 'admin',
      'delete_donor',
      `Donor ${donorId} deleted by admin`
    ]);
    req.flash('success', 'Donor deleted successfully');
    res.redirect('/donors');
  } catch (err) {
    next(err);
  }
});

/**
 * Delete hospital (admin only)
 */
router.post('/hospitals/:id/delete', ensureAdmin, async (req, res, next) => {
  try {
    const hospitalId = req.params.id;
    await pool.query('DELETE FROM hospitals WHERE id = ?', [hospitalId]);
    await pool.query('UPDATE users SET hospital_id = NULL WHERE hospital_id = ?', [hospitalId]);
    await pool.query('INSERT INTO audit_logs (actor, action, details) VALUES (?, ?, ?)', [
      req.session.user?.email || 'admin',
      'delete_hospital',
      `Hospital ${hospitalId} deleted by admin`
    ]);
    req.flash('success', 'Hospital deleted successfully');
    res.redirect('/hospitals');
  } catch (err) {
    next(err);
  }
});

module.exports = router;