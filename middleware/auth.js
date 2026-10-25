// middleware/auth.js
module.exports = {
  ensureAuth: (req, res, next) => {
    if (req.session && req.session.user) return next();
    req.flash('error', 'Login required');
    return res.redirect('/auth/login');
  },
  ensureAdmin: (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') return next();
    req.flash('error', 'Admin access required');
    return res.redirect('/auth/login');
  }
};
