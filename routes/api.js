var express = require('express');
var router = express.Router();
const axios = require('axios');
const {obtainKrakenToken, fetchTariffPlan} = require("../service");

/* POST auth */
router.post('/auth', function(req, res, next) {
  const { email, password } = req.body
  try {
      obtainKrakenToken({ email, password })
          .then(({token, error}) => {
              if (error) {
                  res.status(403);
                  res.send({ error })
              } else {
                  res.send({ token });
              }
            })
        .catch((e) => {
            console.log(e);
            res.status(400);
            res.send({ error: e.message })
          });
  } catch (e) {
    console.log(e);
    res.status(400);
    res.send({ error: e.message })
  }
});

router.post('/connect', function(req, res, next) {
    const { token } = req.body
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
