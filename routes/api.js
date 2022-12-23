const express = require('express');
const router = express.Router();
const {isValidAuthMetadata} = require('../services/octopus.service.js');
const {fetchTariffFromProvider} = require('../services/octopus.service');
const {adoptProviderTariff} = require('../tariff-processors');

router.post('/tariff_plan', function(req, res, next) {
  const {auth_metadata} = req.body;
  if (!auth_metadata || !auth_metadata.data || !auth_metadata.data.email || !auth_metadata.data.password) {
    res.status(422);
    res.send({object: 'error', type: 'api_error', message: 'Invalid credentials'});
    return;
  }
  try {
    isValidAuthMetadata(auth_metadata.data)
        .then(({token, error}) => {
          if (error) {
            throw new Error(error);
          }
          return fetchTariffFromProvider({token, referenceId: auth_metadata.reference_id});
        })
        .then(({tariff, error}) => {
          if (error) {
            throw new Error(error);
          }
          res.send(adoptProviderTariff(tariff));
        })
        .then((result) => res.send(result))
        .catch((e) => {
          console.log(e);
          res.status(400);
          res.send({object: 'error', type: 'api_error', message: e.message});
        });
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send({object: 'error', type: 'server_error', message: e.message});
  }
});

module.exports = router;
