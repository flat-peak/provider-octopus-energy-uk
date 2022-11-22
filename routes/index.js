var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Sign in to your account" });
});

/* GET share page. */
router.get("/share", function (req, res, next) {
  res.render("share", { title: "Share your tariff" });
});

module.exports = router;
