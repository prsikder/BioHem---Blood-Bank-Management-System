// routes/hospitals.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { ensureAuth } = require('../middleware/auth');

/**
 * NOTE: Keep explicit '/me' routes BEFORE parameterized routes so '/me' is not treated as an :id
 */

// Hospital Dashboard
router.get('/dashboard', ensureAuth, async (req, res, next) => {
  try {
    const hid = req.session.user && req.session.user.hospital_id;
    if (!hid) { 
      req.flash('error', 'Your account is not linked to a hospital'); 
      return res.redirect('/'); 
    }
    
    const [hospitalRows] = await pool.query('SELECT * FROM hospitals WHERE id = ?', [hid]);
    if (!hospitalRows.length) return res.redirect('/');
    const hospital = hospitalRows[0];

    // Get statistics
    const [[{ totalRequests }]] = await pool.query(
      'SELECT COUNT(*) AS totalRequests FROM requests WHERE hospital_id = ?',
      [hid]
    );
    const [[{ pendingRequests }]] = await pool.query(
      'SELECT COUNT(*) AS pendingRequests FROM requests WHERE hospital_id = ? AND status = ?',
      [hid, 'pending']
    );
    const [[{ fulfilledRequests }]] = await pool.query(
      'SELECT COUNT(*) AS fulfilledRequests FROM requests WHERE hospital_id = ? AND status = ?',
      [hid, 'fulfilled']
    );
    const [[{ rejectedRequests }]] = await pool.query(
      'SELECT COUNT(*) AS rejectedRequests FROM requests WHERE hospital_id = ? AND status = ?',
      [hid, 'rejected']
    );
    
    // Get emergency requests - check if column exists first
    let emergencyRequests = 0;
    try {
      const [[{ emergencyRequests: er }]] = await pool.query(
        'SELECT COUNT(*) AS emergencyRequests FROM requests WHERE hospital_id = ? AND urgency = ?',
        [hid, 'Emergency']
      );
      emergencyRequests = er || 0;
    } catch (e) {
      // Column might not exist yet
      emergencyRequests = 0;
    }

    // Get recent requests (last 10)
    const [recentRequests] = await pool.query(
      `SELECT r.*, 
              CASE 
                WHEN r.status = 'pending' THEN 'warning'
                WHEN r.status = 'fulfilled' THEN 'success'
                WHEN r.status = 'rejected' THEN 'danger'
                ELSE 'secondary'
              END as status_class
       FROM requests r 
       WHERE r.hospital_id = ? 
       ORDER BY r.created_at DESC 
       LIMIT 10`,
      [hid]
    );

    const stats = {
      totalRequests: totalRequests || 0,
      pendingRequests: pendingRequests || 0,
      fulfilledRequests: fulfilledRequests || 0,
      rejectedRequests: rejectedRequests || 0,
      emergencyRequests: emergencyRequests || 0
    };

    res.render('hospitals/dashboard', {
      hospital,
      stats,
      recentRequests,
      user: req.session.user
    });
  } catch (err) { 
    next(err); 
  }
});

// hospital user: request creation form (uses session hospital_id)
router.get('/me/request', ensureAuth, async (req, res, next) => {
  try {
    const hid = req.session.user && req.session.user.hospital_id;
    if (!hid) { req.flash('error', 'Your account is not linked to a hospital'); return res.redirect('/'); }
    const [rows] = await pool.query('SELECT * FROM hospitals WHERE id = ?', [hid]);
    if (!rows.length) return res.redirect('/');
    res.render('hospitals/request', { 
      hospital: rows[0],
      user: req.session.user 
    });
  } catch (err) { next(err); }
});

router.post('/me/request', ensureAuth, async (req, res, next) => {
    try {
        const hid = req.session.user && req.session.user.hospital_id;
        if (!hid) { 
            req.flash('error', 'Your account is not linked to a hospital'); 
            return res.redirect('/'); 
        }
        
        const units = Math.max(1, Math.min(20, parseInt(req.body.units, 10) || 1)); // Max 20 units
        const blood_group = (req.body.blood_group || '').toString().trim().toUpperCase().slice(0,10);
        const urgency = req.body.urgency === 'Emergency' ? 'Emergency' : 'General';
        const notes = req.body.notes || null;
        
        if (!blood_group) {
            req.flash('error', 'Please select a blood group');
            return res.redirect('/hospitals/me/request');
        }
        
        await pool.query(
            'INSERT INTO requests (hospital_id, blood_group, units, urgency, notes, status, created_at) VALUES (?,?,?,?,?,?,NOW())', 
            [hid, blood_group, units, urgency, notes, 'pending']
        );
        
        req.flash('success', `Blood request submitted successfully (${urgency} priority)`);
        res.redirect('/hospitals/dashboard');
    } catch (err) { 
        next(err); 
    }
});

/**
 * List hospitals
 */
router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 12;
    const offset = (page - 1) * limit;

    if (q) {
      const like = `%${q}%`;
      const [rows] = await pool.query(
        `SELECT SQL_CALC_FOUND_ROWS id,name,email,phone,city,created_at FROM hospitals 
         WHERE name LIKE ? OR email LIKE ? OR city LIKE ? 
         ORDER BY id DESC LIMIT ? OFFSET ?`,
        [like, like, like, limit, offset]
      );
      const [[{ total }]] = await pool.query('SELECT FOUND_ROWS() as total');
      res.render('hospitals/list', { 
        hospitals: rows, 
        q, 
        page, 
        total, 
        limit 
      });
    } else {
      const [rows] = await pool.query(
        `SELECT SQL_CALC_FOUND_ROWS id,name,email,phone,city,created_at 
         FROM hospitals ORDER BY id DESC LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      const [[{ total }]] = await pool.query('SELECT FOUND_ROWS() as total');
      res.render('hospitals/list', { 
        hospitals: rows, 
        q: '', 
        page, 
        total, 
        limit 
      });
    }
  } catch (err) { 
    next(err); 
  }
});

/**
 * Create hospital (form + submit) - protected
 */
router.get('/create', ensureAuth, (req, res) => res.render('hospitals/create'));
router.post('/create', ensureAuth, async (req, res, next) => {
  try {
    const { name, email, phone, city, address } = req.body;
    await pool.query('INSERT INTO hospitals (name,email,phone,city,address) VALUES (?,?,?,?,?)', [name, email, phone, city, address]);
    req.flash('success', 'Hospital added');
    res.redirect('/hospitals');
  } catch (err) { next(err); }
});

/**
 * Show hospital details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query('SELECT * FROM hospitals WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).render('404', { url: req.originalUrl });
    res.render('hospitals/details', { hospital: rows[0] });
  } catch (err) { next(err); }
});

/**
 * Show request form for a specific hospital id (public for authenticated users)
 * GET /hospitals/:id/request
 */
router.get('/:id/request', ensureAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query('SELECT * FROM hospitals WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).render('404', { url: req.originalUrl });
    res.render('hospitals/request', { 
      hospital: rows[0],
      user: req.session.user 
    });
  } catch (err) { next(err); }
});

/**
 * POST /hospitals/:id/request
 */
router.post('/:id/request', ensureAuth, async (req, res, next) => {
    try {
        const hospital_id = Number(req.params.id);
        const user = req.session.user;
        
        if (!user) { 
            req.flash('error','Login required'); 
            return res.redirect('/auth/login'); 
        }

        if (!user.hospital_id || Number(user.hospital_id) !== hospital_id) {
            req.flash('error','You are not authorized to create a request for this hospital');
            return res.redirect('/hospitals/' + hospital_id);
        }

        const units = Math.max(1, Math.min(20, parseInt(req.body.units, 10) || 1));
        const blood_group = (req.body.blood_group || '').toString().trim().toUpperCase().slice(0,10);
        const urgency = req.body.urgency === 'Emergency' ? 'Emergency' : 'General';
        const notes = req.body.notes || null;
        
        if (!blood_group) {
            req.flash('error', 'Please select a blood group');
            return res.redirect(`/hospitals/${hospital_id}/request`);
        }

        await pool.query(
            'INSERT INTO requests (hospital_id, blood_group, units, urgency, notes, status, created_at) VALUES (?,?,?,?,?,?,NOW())', 
            [hospital_id, blood_group, units, urgency, notes, 'pending']
        );
        
        await pool.query('INSERT INTO audit_logs (actor, action, details) VALUES (?, ?, ?)', [
            user.email || user.name || 'hospital',
            'hospital_request',
            `Hospital ${hospital_id} requested ${units} units of ${blood_group} (${urgency})`
        ]);

        req.flash('success', `Blood request submitted successfully (${urgency} priority)`);
        res.redirect('/hospitals/dashboard');
    } catch (err) { 
        next(err); 
    }
});

router.get('/:id/edit', ensureAuth, async (req, res, next) => {
    try {
        const user = req.session.user;
        const hospitalId = Number(req.params.id);
        
        if (!user) {
            req.flash('error', 'Login required');
            return res.redirect('/auth/login');
        }
        
        // Only admin or hospital staff can edit their own hospital
        if (user.role !== 'admin' && (!user.hospital_id || Number(user.hospital_id) !== hospitalId)) {
            req.flash('error', 'Not authorized to edit this hospital');
            return res.redirect('/hospitals/' + hospitalId);
        }
        
        const [rows] = await pool.query('SELECT * FROM hospitals WHERE id = ?', [hospitalId]);
        if (!rows.length) {
            return res.status(404).render('404', { url: req.originalUrl });
        }
        
        res.render('hospitals/edit', { 
            hospital: rows[0],
            user: req.session.user 
        });
    } catch (err) {
        next(err);
    }
});

router.post('/:id/edit', ensureAuth, async (req, res, next) => {
    try {
        const user = req.session.user;
        const hospitalId = Number(req.params.id);
        
        if (!user) {
            req.flash('error', 'Login required');
            return res.redirect('/auth/login');
        }
        
        if (user.role !== 'admin' && (!user.hospital_id || Number(user.hospital_id) !== hospitalId)) {
            req.flash('error', 'Not authorized to edit this hospital');
            return res.redirect('/hospitals/' + hospitalId);
        }
        
        const { name, email, phone, city, address } = req.body;
        
        // Update hospital profile
        await pool.query(
            `UPDATE hospitals 
            SET name = ?, email = ?, phone = ?, city = ?, address = ?
            WHERE id = ?`,
            [name, email || null, phone || null, city || null, address || null, hospitalId]
        );
        
        // Add audit log for profile update
        await pool.query('INSERT INTO audit_logs (actor, action, details) VALUES (?, ?, ?)', [
            user.email || user.name || 'hospital',
            'hospital_update',
            `Updated profile for hospital ${hospitalId}: ${name}`
        ]);
        
        req.flash('success', 'Hospital profile updated successfully');
        
        // Redirect based on user role
        if (user.role === 'admin') {
            res.redirect('/hospitals/' + hospitalId);
        } else {
            res.redirect('/hospitals/dashboard');
        }
    } catch (err) {
        next(err);
    }
});

module.exports = router;