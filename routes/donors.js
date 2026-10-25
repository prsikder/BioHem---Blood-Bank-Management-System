// routes/donors.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const upload = require('../middleware/upload');
const fs = require('fs');
const csvParser = require('csv-parser');
const { toCSV } = require('../utils/csv_util');
const { ensureAuth, ensureAdmin } = require('../middleware/auth');

// utils
const { isEligibleForDonation, daysBetween } = require('../utils/donor_utils');

/**
 * List donors (search + pagination)
 * Accessible to logged-in users (admin/staff). If you want limit to admin only, change middleware.
 */
router.get('/', ensureAuth, async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 12;
    const offset = (page - 1) * limit;

    if (q) {
      const like = `%${q}%`;
      const [rows] = await pool.query(
        `SELECT SQL_CALC_FOUND_ROWS id,name,email,phone,blood_group,city,created_at FROM donors WHERE name LIKE ? OR email LIKE ? OR city LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?`,
        [like, like, like, limit, offset]
      );
      const [[{ total }]] = await pool.query('SELECT FOUND_ROWS() as total');
      res.render('donors/list', { donors: rows, q, page, total, limit });
    } else {
      const [rows] = await pool.query(
        'SELECT SQL_CALC_FOUND_ROWS id,name,email,phone,blood_group,city,created_at FROM donors ORDER BY id DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      const [[{ total }]] = await pool.query('SELECT FOUND_ROWS() as total');
      res.render('donors/list', { donors: rows, q: '', page, total, limit });
    }
  } catch (err) { next(err); }
});

/**
 * Show create form (only admin/staff should create donors)
 */
router.get('/create', ensureAuth, async (req, res) => {
  // authorize: only admin or staff (hospital staff) can create donors
  const u = req.session.user;
  if (!u || (u.role !== 'admin' && u.role !== 'staff')) {
    req.flash('error', 'Not authorized to create donors');
    return res.redirect('/donors');
  }
  return res.render('donors/create');
});

/**
 * Create donor (with optional photo) - only admin/staff
 */
router.post('/create', ensureAuth, upload.single('photo'), async (req, res, next) => {
  try {
    const u = req.session.user;
    if (!u || (u.role !== 'admin' && u.role !== 'staff')) {
      req.flash('error', 'Not authorized to create donors');
      return res.redirect('/donors');
    }

    // read fields (age and last_donation_date optional)
    const { name, email, phone, blood_group, city } = req.body;
    const age = req.body.age ? Number(req.body.age) : null;
    const last_donation_date = req.body.last_donation_date ? req.body.last_donation_date : null;
    // basic validation
    if (!name || !email) { req.flash('error', 'Name and email required'); return res.redirect('/donors/create'); }
    if (age !== null && age < 0) { req.flash('error', 'Invalid age'); return res.redirect('/donors/create'); }

    const photo = req.file ? `/uploads/${req.file.filename}` : null;
    await pool.query(
      'INSERT INTO donors (name,email,phone,blood_group,city,photo,age,last_donation_date,created_at) VALUES (?,?,?,?,?,?,?,?,NOW())',
      [name, email, phone || '', (blood_group || '').toUpperCase(), city || '', photo, age, last_donation_date]
    );
    req.flash('success', 'Donor added');
    res.redirect('/donors');
  } catch (err) { next(err); }
});

/**
 * Donor details: show info, eligibility and donation history
 */
router.get('/:id', async (req, res, next) => {
  try {
    const donorId = Number(req.params.id);
    const [rows] = await pool.query('SELECT * FROM donors WHERE id = ?', [donorId]);
    if (!rows.length) return res.status(404).render('404', { url: req.originalUrl });
    const donor = rows[0];

    // donations history (if donations table exists) otherwise fallback to audit_logs
    let donations = [];
    try {
      const [dRows] = await pool.query('SELECT * FROM donations WHERE donor_id = ? ORDER BY created_at DESC', [donorId]);
      donations = dRows;
    } catch (e) {
      const [logs] = await pool.query(
        'SELECT created_at, details, actor FROM audit_logs WHERE action = ? AND details LIKE ? ORDER BY created_at DESC LIMIT 50',
        ['donation', `%donor ${donorId}%`]
      );
      donations = logs.map(l => ({
        created_at: l.created_at,
        blood_group: (l.details.match(/units of (\w+\+?)/i) || [null, ''])[1],
        units: Number((l.details.match(/(\d+)\s+units?/) || [null, 0])[1]) || 0,
        recorded_by: l.actor || ''
      }));
    }

    // compute eligibility
    const eligible = isEligibleForDonation(donor);

    res.render('donors/details', { donor, donations, eligible });
  } catch (err) { next(err); }
});

/**
 * Edit donor form (admin or donor owner)
 */
router.get('/:id/edit', ensureAuth, async (req, res, next) => {
  try {
    const user = req.session.user;
    const donorId = Number(req.params.id);
    if (!user) { req.flash('error','Login required'); return res.redirect('/auth/login'); }
    if (user.role !== 'admin' && user.donor_id !== donorId) {
      req.flash('error','Not authorized');
      return res.redirect('/donors/' + donorId);
    }
    const [rows] = await pool.query('SELECT * FROM donors WHERE id = ?', [donorId]);
    if (!rows.length) return res.status(404).render('404', { url: req.originalUrl });
    res.render('donors/edit', { donor: rows[0] });
  } catch (err) { next(err); }
});

/**
 * Update donor (admin or donor owner)
 */
router.post('/:id/edit', ensureAuth, upload.single('photo'), async (req, res, next) => {
  try {
    const user = req.session.user;
    const donorId = Number(req.params.id);
    if (!user) { req.flash('error','Login required'); return res.redirect('/auth/login'); }
    if (user.role !== 'admin' && user.donor_id !== donorId) {
      req.flash('error','Not authorized'); return res.redirect('/donors/' + donorId);
    }

    const { name, email, phone, blood_group, city } = req.body;
    const age = req.body.age ? Number(req.body.age) : null;
    const last_donation_date = req.body.last_donation_date ? req.body.last_donation_date : null;

    const photo = req.file ? `/uploads/${req.file.filename}` : undefined;

    if (photo !== undefined) {
      await pool.query(
        'UPDATE donors SET name=?,email=?,phone=?,blood_group=?,city=?,photo=?,age=?,last_donation_date=? WHERE id=?',
        [name, email, phone, (blood_group||'').toUpperCase(), city, photo, age, last_donation_date, donorId]
      );
    } else {
      await pool.query(
        'UPDATE donors SET name=?,email=?,phone=?,blood_group=?,city=?,age=?,last_donation_date=? WHERE id=?',
        [name, email, phone, (blood_group||'').toUpperCase(), city, age, last_donation_date, donorId]
      );
    }

    req.flash('success','Profile updated');
    res.redirect('/donors/' + donorId);
  } catch (err) { next(err); }
});

/**
 * Delete donor (admin only)
 */
router.post('/:id/delete', ensureAuth, async (req, res, next) => {
  try {
    const user = req.session.user;
    if (!user || user.role !== 'admin') { req.flash('error','Access denied'); return res.redirect('/donors'); }
    await pool.query('DELETE FROM donors WHERE id = ?', [req.params.id]);
    await pool.query('UPDATE users SET donor_id = NULL WHERE donor_id = ?', [req.params.id]);
    req.flash('success','Donor removed');
    res.redirect('/donors');
  } catch (err) { next(err); }
});

/**
 * CSV import (admin/staff)
 */
router.get('/import', ensureAuth, (req, res) => res.render('donors/import'));
router.post('/import', ensureAuth, upload.single('csvfile'), async (req, res, next) => {
  // only admin/staff allowed
  const u = req.session.user;
  if (!u || (u.role !== 'admin' && u.role !== 'staff')) {
    req.flash('error','Not authorized'); return res.redirect('/donors');
  }

  if (!req.file) { req.flash('error', 'No file uploaded'); return res.redirect('/donors/import'); }
  const filePath = req.file.path;
  const results = [];
  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      let conn = null;
      try {
        conn = await pool.getConnection();
        await conn.beginTransaction();
        for (const r of results) {
          const name = (r.name || r.Name || 'Unknown').toString().trim();
          const email = (r.email || r.Email || '').toString().trim();
          const phone = (r.phone || r.Phone || '').toString().trim();
          const blood_group = (r.blood_group || r.bloodGroup || '').toString().trim().toUpperCase().slice(0,10);
          const city = (r.city || r.City || '').toString().trim();
          await conn.query('INSERT INTO donors (name,email,phone,blood_group,city) VALUES (?,?,?,?,?)', [name, email, phone, blood_group, city]);
        }
        await conn.commit();
        req.flash('success', 'CSV imported');
      } catch (err) {
        if (conn) { try { await conn.rollback(); } catch(e){} }
        console.error('CSV import error', err);
        req.flash('error', 'CSV import failed: ' + (err && err.message ? err.message : err));
      } finally {
        if (conn) try { conn.release(); } catch (e) {}
        try { fs.unlinkSync(filePath); } catch (e) {}
        return res.redirect('/donors');
      }
    })
    .on('error', (err) => {
      console.error('CSV stream error', err);
      try { fs.unlinkSync(filePath); } catch (e) {}
      req.flash('error','CSV read failed'); return res.redirect('/donors/import');
    });
});

/**
 * CSV export
 */
router.get('/export/csv', ensureAuth, async (req, res, next) => {
  try {
    // only admin/staff allowed to export
    const u = req.session.user;
    if (!u || (u.role !== 'admin' && u.role !== 'staff')) {
      req.flash('error','Not authorized'); return res.redirect('/donors');
    }

    const [rows] = await pool.query('SELECT id,name,email,phone,blood_group,city,created_at FROM donors ORDER BY id DESC');
    const csv = toCSV(rows, ['id','name','email','phone','blood_group','city','created_at']);
    res.header('Content-Type', 'text/csv');
    res.attachment('donors.csv');
    return res.send(csv);
  } catch (err) { next(err); }
});

/**
 * Donate action (admin only) - already implemented earlier, kept here
 * (This handler does the checks for age and 90 days and updates stock/donations/audit_logs)
 */
router.post('/:id/donate', ensureAuth, async (req, res, next) => {
  try {
    const user = req.session.user;
    if (!user) { req.flash('error','Login required'); return res.redirect('/auth/login'); }

    // only admin (not donor) may record donation
    if (user.role !== 'admin') {
      req.flash('error','Only admins can record donations');
      return res.redirect('/donors/' + req.params.id);
    }

    const donorId = Number(req.params.id);
    const units = Math.max(1, Math.min(2, parseInt(req.body.units, 10) || 1)); // max 2 units
    const bg = (req.body.blood_group || '').toString().trim().toUpperCase().slice(0,10);

    // fetch donor to validate age & last donation
    const [[donorRow]] = await pool.query('SELECT id, age, last_donation_date FROM donors WHERE id = ?', [donorId]);
    if (!donorRow) { req.flash('error','Donor not found'); return res.redirect('/donors'); }

    // check age
    if (donorRow.age && donorRow.age < 18) {
      req.flash('error', 'Donor is under 18 and not eligible to donate');
      return res.redirect('/donors/' + donorId);
    }

    // check 90 days
    if (donorRow.last_donation_date) {
      const days = daysBetween(donorRow.last_donation_date, new Date());
      if (days < 90) {
        req.flash('error', `Donor last donated ${days} days ago — must wait 90 days`);
        return res.redirect('/donors/' + donorId);
      }
    }

    // perform transaction: update stock, insert donation record, update donor last_donation_date, audit log
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // upsert stock row (lock)
      const [stockRows] = await conn.query('SELECT * FROM blood_stock WHERE blood_group = ? FOR UPDATE', [bg]);
      if (stockRows.length) {
        await conn.query('UPDATE blood_stock SET units = units + ? WHERE blood_group = ?', [units, bg]);
      } else {
        await conn.query('INSERT INTO blood_stock (blood_group, units) VALUES (?, ?)', [bg, units]);
      }

      // insert donation history (if donations table exists)
      try {
        await conn.query('INSERT INTO donations (donor_id,blood_group,units,recorded_by) VALUES (?,?,?,?)', [
          donorId, bg, units, user.email || user.name || 'admin'
        ]);
      } catch (e) {
        // if donations table doesn't exist, ignore but continue
      }

      // update donor last_donation_date to today
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;
      await conn.query('UPDATE donors SET last_donation_date = ? WHERE id = ?', [todayStr, donorId]);

      // audit log
      await conn.query('INSERT INTO audit_logs (actor, action, details) VALUES (?, ?, ?)', [
        user.email || user.name || 'admin',
        'donation',
        `Admin ${user.email || user.name} recorded ${units} units for donor ${donorId} (${bg})`
      ]);

      await conn.commit();
      req.flash('success', `Recorded ${units} units of ${bg} for donor ${donorId}`);
      // emit update (if you have socket.io)
      const io = req.app.get('io'); if (io) io.emit('stockUpdated', { blood_group: bg });

      return res.redirect('/donors/' + donorId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      try { conn.release(); } catch (e) {}
    }
  } catch (err) { next(err); }
});

module.exports = router;
