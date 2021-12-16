var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var cors = require('cors')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const user     = require('./routes/user');
const trainer  = require('./routes/trainer');
const package  = require('./routes/package');
const payment  = require('./routes/payment');
const admin    = require('./routes/admin');
const ticket   = require('./routes/ticket');
const review   = require('./routes/review');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors({ origin: true }));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use('/api/user', user);
app.use('/api/trainer', trainer);
app.use('/api/package', package);
app.use('/payment', payment);
app.use('/api/admin', admin);
app.use('/api/ticket', ticket);
app.use('/api/review', review);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.get('/', (req, res) => {
  res.send('Fitness hub app running slowly');
});
module.exports = app;