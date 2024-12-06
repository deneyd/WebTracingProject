var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var venuesRouter = require('./routes/venues');
var adminsRouter = require('./routes/admins');

var app = express();


/* mysql in cs50 */
var mysqlConnectionPool = mysql.createPool({
  host: '127.0.0.1',
  debug: false,
  database: 'covid_tracing',
  multipleStatements: true,
});
app.use(function(req, res, next) {
  req.pool = mysqlConnectionPool;
  next();
});

/* setting session */
var sessionStore = new MySQLStore({}, mysqlConnectionPool);
app.use(session({
  coookie: {
    sameSite: true,
    secure: false,
  },
  store: sessionStore,
  secret: 'session',
  resave: false,
  saveUninitialized: true,
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/users', express.static(path.join(__dirname, 'private/assets')));
app.use('/venues', venuesRouter);
app.use('/admins', adminsRouter);

module.exports = app;
