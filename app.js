// environment variables
require("dotenv").config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// route definitions
var peopleRouter = require('./routes/people');
var moviesRouter = require('./routes/movies');
var usersRouter = require('./routes/user');

var app = express();

// knex setup
const options = require('./knexfile.js');
const knex = require('knex')(options);

// swagger stuff
const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');

app.use((req, res, next) => {
  req.db = knex;
  next();
})

app.get("/knex", (req, res, next) => {
  req.db
    .raw("SELECT VERSION()")
    .then(version => console.log(version[0][0]))
    .catch(err => {
      console.log(err);
      throw err;
    });
  res.send("Version Logged Successfully");
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.get('/', (req, res) => {
  // redirect to docs as to not take over all the routes
  res.redirect('/docs'); 
});

app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));
app.use('/people', peopleRouter);
app.use('/movies', moviesRouter);
app.use('/user', usersRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;