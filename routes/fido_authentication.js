var express = require('express');
var router = express.Router();
var pgp = require('pg-promise')();
var pg_config = require('../pg_config.js');
var db = pgp(pg_config.config);
var jwkToPem = require('jwk-to-pem')
var crypto = require('crypto');
var fidoSampleWebFunction = require('../fidoSampleWebFunction.js');
var URLSafeBase64 = require('urlsafe-base64');

router.get('/', function(req, res, next) {
});

router.post('/', function(req, res, next) {
  var keyHandle = req.body.resultKeyHandle;
  var signature64 = req.body.signatureData;
  var clientData64 = req.body.clientData;
  var challenge = req.session.challenge;
  db.query("SELECT u2f_publickey,name,oid,email FROM users WHERE u2f_keyHandle ='" + keyHandle + "';")
    .then(function(result){
       if(result){
       var dbresult = result[0]
           try {
	     console.log("DB Result :" + dbresult);
	     console.log("--------------------");
             var  publicKey = dbresult.u2f_publickey
             var s = new Buffer(signature64, 'base64');
	     var ss = s.slice(0,5);
	     console.log("User presence & counter :" + ss.toString("hex"));
             console.log("--------------------");
	     var c = s.slice(5);
	     console.log("signature:" + c.toString("hex"));
             console.log("--------------------");
	     var clientData = URLSafeBase64.decode(clientData64);
             var clientDataJSON = JSON.parse(clientData);
	     console.log("client data:" + clientData);
             console.log("challenge:" + clientDataJSON.challenge);
             console.log("--------------------");
           }catch(e){
             console.log("VERIFY_ERR : " + e);
           }

         if(clientDataJSON.challenge == challenge){
	 /* Verify Signature */
         /*     doing...     */

              var username = dbresult.name;
              var user_email = dbresult.email;
              req.session.challenge = challenge
              req.session.user_id = dbresult.oid;
              req.session.username = dbresult.name;
              req.session.user_email = dbresult.email
              res.render('users', { err: "Congratiration! FIDO Authentication is Success!",
                                    username: username ,
                                    user_email: user_email,
				    challenge
				  });         
           }else{
	     fidoSampleWebFunction.goToIndex(req,res,"Verify is failed(Challenge Unmatched).");
           }
   
      }else{
        fidoSampleWebFunction.goToIndex(req,res,"Invalid Request");
      }
    })

    .catch(function(error){
      console.log("DB_ERR : " + error);
      fidoSampleWebFunction.goToIndex(req,res,"Invalid Request");
    });

});

module.exports = router;
