var express = require('express');
var router = express.Router();
const {obtainKrakenToken, fetchTariffPlan} = require("../services/octopus.service.js");
const {hasValidCredentials} = require("../services/flatpeek.service");

/* POST auth */
router.post('/auth', function(req, res, next) {
  const { email, password, pub_key } = req.body;
  try {
      hasValidCredentials(pub_key)
          .then((success) => {
              if (!success) {
                  res.status(403);
                  res.send({ error: 'Can\'t authorise to Flatpeak' })
                  return;
              }
              return obtainKrakenToken({ email, password })
                  .then(({token, error}) => {
                      if (error) {
                          res.status(403);
                          res.send({ error })
                      } else {
                          req.session.token = token;
                          req.session.email = email;
                          req.session.password = password;
                          req.session.pub_key = pub_key;
                          res.send({});
                      }
                  })
          })
          .catch((e) => {
              console.log(e);
              res.status(400);
              res.send({ error: e.message })
          })
  } catch (e) {
    console.log(e);
    res.status(400);
    res.send({ error: e.message })
  }
});

router.post('/connect', function(req, res, next) {
    const { token, email, password, pub_key } = req.session;

    if (!token) {
        res.status(401);
        res.send({ error: 'Forbidden' });
        return;
    }
    try {
        console.log('Try with token', token)
        fetchTariffPlan({ token })
            .then(({tariffPlan, error}) => {
                if (error) {
                    res.status(403);
                    res.send({ error })
                } else {
                    res.send({ tariff_plan: tariffPlan });
                }
            })
            .catch((e) => {
                console.log(e);
                res.status(400);
                res.send({ error: e.message })
            });
    } catch (e) {
        console.log(e);
        res.status(500);
        res.send({ error: e.message })
    }
});


module.exports = router;
