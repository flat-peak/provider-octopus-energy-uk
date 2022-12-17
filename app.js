const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const {create} = require('express-handlebars');
const sessions = require('express-session');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();

const indexRouter = require('./routes/index');
const apiRouter = require('./routes/api');
const {respondWithError} = require('./helpers');

const app = express();

// view engine setup
const views = path.join(__dirname, 'views');

const hbs = create({
  extname: '.hbs',
  partialsDir: [path.join(views, 'layouts'), path.join(views, 'partials')],
  defaultLayout: 'base',
});
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');


app.use(logger('dev'));
app.use(sessions({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 10, // 10 min
  },
  resave: false,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  respondWithError(req, res, err.message);
});

module.exports = app;
