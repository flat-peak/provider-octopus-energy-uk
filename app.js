const path = require('path');
require('dotenv').config({path: path.join(__dirname, '.env')});
const createError = require('http-errors');
const express = require('express');
const requestLogger = require('morgan');
const {create} = require('express-handlebars');
const bodyParser = require('body-parser');
const {integrateProvider, errorHandler} = require('@flat-peak/express-integration-sdk');
const {authorise, capture, convert} = require('./modules/provider');
const {logger} = require('./modules/logger/cloudwatch');

const app = express();

// view engine setup
const views = path.join(__dirname, 'views');
app.set('views', views);

const hbs = create({
  extname: '.hbs',
  partialsDir: [path.join(views, 'layouts'), path.join(views, 'partials')],
  defaultLayout: 'base',
});
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.use(requestLogger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

// The `integrateProvider` router attaches /, /auth, /share, /cancel
// and /api/tariff_plan routes to the baseURL
app.use(integrateProvider({
  pages: /** @type OnboardPages */ {
    index: {
	  view: 'index',
	  title: 'Octopus Energy integration',
    },
    auth: {
	  view: 'auth',
	  title: 'Sign in to your account with Octopus Energy',
    },
    share: {
	  view: 'share',
	  title: 'Share your tariff',
    },
    success: {
	  view: 'success',
	  title: 'You have shared your tariff with Octopus Energy',
    },
  },
  appParams: /** @type AppParams */ {
    api_url: process.env.FLATPEAK_API_URL,
    provider_id: process.env.PROVIDER_ID,
  },
  providerHooks: /** @type ProviderHooks<Object> */ {
    authorise: authorise,
    capture: capture,
    convert: convert,
	logger: logger,
  },
}));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(errorHandler);

module.exports = app;
