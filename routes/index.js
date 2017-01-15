var express = require('express');
var router = express.Router();
var fidoSampleWebFunction = require('../fidoSampleWebFunction.js');
var pgp = require('pg-promise')();
var pg_config = require('../pg_config.js');
var db = pgp(pg_config.config);

/* GET home page. */
router.get('/', function(req, res, next) {
  if (req.session.user_id) {
    fidoSampleWebFunction.goToUsers(req,res);
  }else{
    fidoSampleWebFunction.goToIndex(req,res);
  }
});

/* Nomal Login. */
router.post('/', function(req, res, next) {
  var email = req.body.email;
  var password = req.body.password;
  db.query("SELECT name,oid,email FROM users WHERE email = '" + email + "' AND (password_hash = crypt('" + password + "', password_hash));")
	.then(function(result){
          if (result){
            var dbresult = result[0]
	    console.log(dbresult);
            var username = dbresult.name;
            var user_email = dbresult.email;
            req.session.user_id = dbresult.oid;
            req.session.username = dbresult.name;
            req.session.user_email = dbresult.email;
            res.render('users', { err: "",
                                  username: username ,
                                  user_email: user_email
            });
          }else{
            fidoSampleWebFunction.goToIndex(req,res,"Please confirm your email or password.");
          }
	})
	.catch(function(error){
          console.log("DB_ERR : " + error);
          fidoSampleWebFunction.goToIndex(req,res,"Please confirm your email or password.");
	});
});

/ *U2F Login. */

router.post('/u2f_authentication', function(req, res, next) {
  var email = req.body.email;
  db.query("SELECT name,u2f_keyhandle FROM users WHERE email = '" + email + "';")
        .then(function(result){
          if (result){
            var dbresult = result[0]
            console.log(dbresult);
            var username = dbresult.name;
            var keyHandle = dbresult.u2f_keyhandle;
	    var challenge = fidoSampleWebFunction.getUniqueStr();
            req.session.challenge = challenge
            res.render('u2fauth', { err: "",
                                  username: username ,
                                  keyHandle: keyHandle ,
				  challenge: challenge
            });
          }else{
            fidoSampleWebFunction.goToIndex(req,res,"Please confirm your email");
          }
        })
        .catch(function(error){
          console.log("DB_ERR : " + error);
          fidoSampleWebFunction.goToIndex(req,res,"Please confirm your email");
        });
});

module.exports = router;
