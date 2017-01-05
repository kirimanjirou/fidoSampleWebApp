var express = require('express');
var router = express.Router();
var pgp = require('pg-promise')();
var pg_config = require('../pg_config.js');
var db = pgp(pg_config.config);
var jwkToPem = require('jwk-to-pem')
var crypto = require('crypto');
var fidoSampleWebFunction = require('../fidoSampleWebFunction.js');

router.get('/', function(req, res, next) {
});

router.post('/', function(req, res, next) {
  var credID = req.body.credID;
  var signature = req.body.signature;
  var authnrData = req.body.authnrdata;
  var clientData = req.body.clientdata;
  var challenge = req.session.challenge;

  db.query("SELECT jwt,name,oid,email FROM users WHERE cred_id ='" + credID + "';")
	.then(function(result){
       if(result){
       var dbresult = result[0]
           try {
             var  publicKey = dbresult.jwt
             var c = new Buffer(clientData, 'base64');
             var cc = JSON.parse(c.toString().replace(/\0/g,''));
           }catch(e){
             console.log("VERIFY_ERR : " + e);
           }

         if(cc.challenge != challenge){
            fidoSampleWebFunction.goToIndex(req,res,"Verify is failed.");
         }else{
            try{
              // Hash data with sha256
              const hash = crypto.createHash('sha256');
              hash.update(c);
              var h = hash.digest();
   
              // Verify signature is correct for authnrData + hash
              var verify = crypto.createVerify('RSA-SHA256');
              verify.update(new Buffer(authnrData,'base64'));
              verify.update(h);
            }catch(e){
              console.log("VERIFY_ERR : " + e);
            }

            if((verify.verify(jwkToPem(JSON.parse(publicKey)), signature, 'base64')) != true ){;
              fidoSampleWebFunction.goToIndex(req,res,"Verify is failed.");
            }else{
              var username = dbresult.name;
              var user_email = dbresult.email;
              req.session.user_id = dbresult.oid;
              req.session.username = dbresult.name;
              req.session.user_email = dbresult.email
              res.render('users', { err: "Congratiration! FIDO Authentication is Success!",
                                    username: username ,
                                    user_email: user_email
              });
            }
         }
      }else{
        fidoSampleWebFunction.goToIndex(req,res,"Invalid Credential ID");
      }
    })
    .catch(function(error){
      console.log("DB_ERR : " + error);
      fidoSampleWebFunction.goToIndex(req,res,"Invalid Credential ID");
    });
});

module.exports = router;
