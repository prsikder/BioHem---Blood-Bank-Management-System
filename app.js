// app.js
require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const engine = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const noCache = require('./middleware/noCache'); // middleware you already added
const helmet = require('helmet');

const app = express();

// view engine
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// security headers
app.use(helmet());

// logging
app.use(morgan('dev'));

// parsers
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// serve static assets (keep cacheable)
app.use(express.static(path.join(__dirname, 'public')));

// session - must be before routes so req.session exists for middleware
app.set('trust proxy', process.env.TRUST_PROXY === 'true'); // enable if behind proxy
app.use(session({
  name: process.env.SESSION_NAME || 'connect.sid',
  secret: process.env.SESSION_SECRET || 'change_this_secret_in_production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: (process.env.NODE_ENV === 'production'), // set true in production (HTTPS)
    sameSite: 'lax',
    maxAge: parseInt(process.env.SESSION_MAXAGE_MS || String(24 * 60 * 60 * 1000), 10) // default 24h
  }
}));

// flash messages
app.use(flash());

// make session + flash available in views
app.use((req, res, next) => {
  res.locals.success = req.flash('success') || [];
  res.locals.error = req.flash('error') || [];
  res.locals.user = req.session ? req.session.user : null;
  res.locals.title = res.locals.title || (process.env.SITE_TITLE || 'RedCell-BD');
  next();
});

// apply no-cache, but only for HTML responses (so assets can be cached)
app.use((req, res, next) => {
  // Apply no-cache only to requests that accept HTML
  if (req.accepts && req.accepts('html')) {
    noCache(req, res, next);
  } else {
    next();
  }
});

// route handlers
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const donorsRouter = require('./routes/donors');
const hospitalsRouter = require('./routes/hospitals');
const adminRouter = require('./routes/admin');
const apiRouter = require('./routes/api');

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/donors', donorsRouter);
app.use('/hospitals', hospitalsRouter);
app.use('/admin', adminRouter);
app.use('/api', apiRouter);
// 404 handler (keep after routes)
app.use((req, res) => {
  res.status(404).render('404', { url: req.originalUrl });
});

// error handler
app.use((err, req, res, next) => {
  console.error(err && err.stack ? err.stack : err);
  // show friendly page but include stack in console
  res.status(500).render('500', { error: err });
});

const PORT = process.env.PORT || 3000;

// start server with socket.io
const server = http.createServer(app);
const io = require('socket.io')(server);

// attach io to app (routes can access with req.app.get('io'))
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
});

server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

// export app for tests (if needed)
module.exports = app;
