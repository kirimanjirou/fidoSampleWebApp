var express = require('express');
var router = express.Router();
var fidoSampleWebFunction = require('../fidoSampleWebFunction.js');
var pgp = require('pg-promise')();
var pg_config = require('../pg_config.js');
var db = pgp(pg_config.config);

router.get('/', function(req, res, next) {
});

router.post('/', function(req, res, next) {
  var oid = req.session.oid;
  var publicKey = req.body.publicKey;
  var credID = req.body.credID;
  var update_query = "UPDATE users SET (jwt,cred_id) = (" + "'" + publicKey + "','" + credID + "') WHERE oid =" +  req.session.user_id + ";";
  console.log(update_query);
  db.query("UPDATE users SET (jwt,cred_id) = (" + "'" + publicKey + "','" + credID + "') WHERE oid =" +  req.session.user_id + ";")
	.then(function(){
          fidoSampleWebFunction.goToUsers(req,res,"Server stored your PublickKey...Logout than try to FIDO Authentication.");
	})
	.catch(function(error){
          console.log("DB_ERR : " + error );
          fidoSampleWebFunction.goToUsers(req,res,error);
	});
});

module.exports = router;
