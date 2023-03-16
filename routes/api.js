const express = require('express');
const router = express.Router();
const {fetchTariffFromProvider, isValidAuthMetadata} = require('../modules/provider/service');
const {adoptProviderTariff} = require('../modules/provider/tariff-processors');
const {logger} = require('../modules/logger/cloudwatch');

router.post('/tariff_plan', function(req, res, next) {
  let {auth_metadata} = req.body;
  if (auth_metadata?.data?.data) { // FIXME: remove temporary fix when redundant level is removed
    auth_metadata = auth_metadata?.data;
  }
  if (!auth_metadata || !auth_metadata.data || !auth_metadata.data.email || !auth_metadata.data.password) {
    logger.error(`INVALID auth_metadata ${JSON.stringify(auth_metadata)}`);
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
          res.send(adoptProviderTariff(tariff.agreement));
        })
        .then((result) => res.send(result))
        .catch((e) => {
          logger.error(e);
          res.status(400);
          res.send({object: 'error', type: 'api_error', message: e.message});
        });
  } catch (e) {
    logger.error(e);
    res.status(500);
    res.send({object: 'error', type: 'server_error', message: e.message});
  }
});

module.exports = router;
