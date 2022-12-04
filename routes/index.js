var express = require('express');
const {FlatpeakService} = require("../services/flatpeak.service");
const {obtainKrakenToken} = require("../services/octopus.service");
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Octopus integration' });
});

/* POST auth page. */
router.post('/auth', function(req, res, next) {
  const {pub_key, product_id, customer_id} = req.body;
  const service = new FlatpeakService(process.env.FLATPEAK_API_URL, pub_key);
  if (!pub_key) {
      res.status(422);
      res.render('error', {message: 'Publishable key is required to proceed'});
      return;
  }
  service
      .getAccount()
      .then((account) => {
        if (account.object === 'error') {
          res.status(422);
          res.render('error', {message: account.message});
          return;
        }
        req.session.lastError = '';
        req.session.account = account;
        req.session.pub_key = pub_key;
        req.session.product_id = product_id;
        req.session.customer_id = customer_id;
        res.render('auth', {
            title: 'Sign in to your account',
            lastError: req.session.lastError,
            accountId: req.session.account.id, // TODO: temporary for testing purpose, remove later
            ProviderDisplayName: 'OctopusEnergy', // FIXME: wording?
            ManufacturerDisplayName: '{ManufacturerDisplayName}', // FIXME: connect
            ManufacturerTermsUrl: '#', // FIXME: connect
            ManufacturerPolicyUrl: '#' // FIXME: connect
        });
      });
});

router.get('/auth', function(req, res, next) {
    if (!req.session || !req.session.account) {
        res.redirect('/');
        return;
    }
    res.render('auth', {
        title: 'Sign in to your account',
        lastError: req.session.lastError,
        accountId: req.session.account.id, // TODO: temporary for testing purpose, remove later
        ProviderDisplayName: 'OctopusEnergy', // FIXME: wording?
        ManufacturerDisplayName: '{ManufacturerDisplayName}', // FIXME: connect
        ManufacturerTermsUrl: '#', // FIXME: connect
        ManufacturerPolicyUrl: '#' // FIXME: connect
    });
});

/* GET share page. */
router.post('/share', function(req, res, next) {
    if (!req.session || !req.session.account) {
        res.redirect('/');
        return;
    }
    const { email, password } = req.body;
    obtainKrakenToken({ email, password })
        .then(({token, error}) => {
            if (error) {
               req.session.lastError = error;
               res.redirect('/auth');
               return;
            }
            req.session.lastError = '';
            req.session.email = email;
            req.session.password = password;
            res.render('share', {
                title: 'Share your tariff',
                ProviderDisplayName: 'OctopusEnergy', // FIXME: wording?
                ManufacturerDisplayName: '{ManufacturerDisplayName}', // FIXME: connect
                ManufacturerTermsUrl: '#', // FIXME: connect
                ManufacturerPolicyUrl: '#' // FIXME: connect
            });
        });
});

module.exports = router;
