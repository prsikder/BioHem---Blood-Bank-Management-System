// middleware/noCache.js
module.exports = function noCache(req, res, next) {
  // Only set no-cache headers for HTML responses (pages)
  // This prevents browser/back-button from showing cached authenticated pages.
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
};
