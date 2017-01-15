var express = require('express');
var router = express.Router();
var moment = require('moment');
var pgp = require('pg-promise')();
var pg_config = require('../pg_config.js');
var db = pgp(pg_config.config);

router.get('/', function(req, res, next) {
      res.render('register', { err: ''
      });
});

router.post('/createuser', function(req, res, next) {
  var email = req.body.email;
  var password = req.body.password;
  var name = req.body.name;
  var doc = {
	name: name,
	email: email,
	password_hash: "crypt('" + password + "', gen_salt('bf'))"
	}
  db.none("INSERT INTO users (name,email, password_hash) VALUES (" + "'" + name + "','" + email  + "'," + "crypt('" + password + "', gen_salt('bf')))")
	.then(function(){
          res.redirect('/');
        })
        .catch(function(error){
	  console.log("DB_ERR : " +error);
          res.render('register', { err: error });
	});
});

module.exports = router;
