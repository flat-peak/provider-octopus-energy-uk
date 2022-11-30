var express = require('express');
var router = express.Router();
const {obtainKrakenToken} = require("../services/octopus.service.js");
const {connectTariffPlan, FlatpeakService} = require("../services/flatpeak.service");
const {fetchAgreement} = require("../services/octopus.service");

/* POST auth */
router.post('/auth', function(req, res, next) {
  const { email, password, pub_key, product_id, customer_id } = req.body;
  const service = new FlatpeakService(process.env.FLATPEAK_API_URL, pub_key)
  try {
      service
          .hasValidCredentials()
          .then((success) => {
              if (!success) {
                  throw new Error('Can\'t authorise to Flatpeak');
              }
              return obtainKrakenToken({ email, password })
                  .then(({token, error}) => {
                      if (error) {
                          throw new Error(error);
                      }
                      req.session.email = email;
                      req.session.password = password;
                      req.session.pub_key = pub_key;
                      req.session.product_id = product_id;
                      req.session.customer_id = customer_id;
                      res.send({});
                  })
          })
          .catch((e) => {
              console.log(e);
              res.status(400);
              res.send({ object: 'error', type: 'api_error', message: e.message })
          })
  } catch (e) {
      console.log(e);
      res.status(500);
      res.send({ object: 'error', type: 'server_error', message: e.message })
  }
});

router.post('/connect', function(req, res, next) {
    const { email, password, pub_key, product_id, customer_id } = req.session;

    try {
        obtainKrakenToken({ email, password }).then(({token, error}) => {
            if (error) {
                throw new Error(error);
            }
            return fetchAgreement({ token });
        })
            .then(({agreement, error}) => {
                if (error) {
                    throw new Error(error);
                }
                return connectTariffPlan(agreement, product_id, customer_id, {email, password }, pub_key)
            })
            .then((result) => res.send(result))
            .catch((e) => {
                console.log(e);
                res.status(400);
                res.send({ object: 'error', type: 'api_error', message: e.message })
            });
    } catch (e) {
        console.log(e);
        res.status(500);
        res.send({ object: 'error', type: 'server_error', message: e.message })
    }
});


module.exports = router;
