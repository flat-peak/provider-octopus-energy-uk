const express = require('express');
const {captureInputParams, populateTemplate, captureAuthMetaData, respondWithError} = require('../helpers');
const {isValidAuthMetadata, fetchTariffFromProvider} = require('../services/octopus.service');
const {connectTariff} = require('../services/flatpeak.service');
const router = express.Router();

router.get('/', function(req, res, next) {
  const {
    'publishable-key': pub_key,
    'product-id': product_id,
    'customer-id': customer_id,
    'callback-url': callback_url,
  } = req.headers;
  if (pub_key) { // capture input params from headers
    return captureInputParams(req, res, {pub_key, product_id, customer_id, callback_url});
  }
  // capture input params from javascript context
  res.render('index', {title: 'Octopus Energy integration'});
});

// capture input params from POST payload
router.post('/', function(req, res, next) {
  const {pub_key, product_id, customer_id, callback_url} = req.body;
  captureInputParams(req, res, {pub_key, product_id, customer_id, callback_url});
});

router.get('/auth', function(req, res, next) {
  if (!req.session || !req.session.account) {
    res.redirect('/');
    return;
  }

  res.render('auth', {
    title: 'Sign in to your account with Octopus Energy',
    ...populateTemplate(req.session),
  });
});

router.post('/auth', function(req, res, next) {
  if (!req.session || !req.session.account) {
    res.redirect('/');
    return;
  }
  captureAuthMetaData(req, res, req.body);
});

router.get('/share', function(req, res, next) {
  if (!req.session || !req.session.account) {
    res.redirect('/');
    return;
  }
  if (!req.session.auth_metadata) {
    res.redirect('/auth');
    return;
  }
  res.render('share', {
    title: 'Share your tariff',
    ...populateTemplate(req.session),
  });
});

router.post('/share', function(req, res, next) {
  if (!req.session || !req.session.account) {
    res.redirect('/');
    return;
  }
  if (!req.session.auth_metadata) {
    res.redirect('/auth');
    return;
  }

  const {auth_metadata, pub_key, product_id, customer_id} = req.session;

  try {
    isValidAuthMetadata(auth_metadata)
        .then(({token, error}) => {
          if (error) {
            throw new Error(error);
          }
          return fetchTariffFromProvider({token});
        })
        .then(({tariff, error}) => {
          if (error) {
            throw new Error(error);
          }
          return connectTariff(tariff, product_id, customer_id, auth_metadata, pub_key);
        })
        .then((result) => {
          res.render('success', {
            title: 'Success',
            ...populateTemplate(req.session),
            ...result,
          });
        })
        .catch((e) => {
          console.log(e);
          respondWithError(req, res, e.message);
        });
  } catch (e) {
    console.log(e);
    respondWithError(req, res, e.message);
  }
});

router.post('/cancel', function(req, res, next) {
  respondWithError(req, res, 'User rejects integration');
});

module.exports = router;
