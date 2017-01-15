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
             var  publicKey = dbresult.u2f_publickey
             var s = new Buffer(signature64, 'base64');
	     var userPresenceFlag  = s.slice(0,1);
             var counter  = s.slice(1,5);
	     console.log("User presence flag:" + userPresenceFlag.toString("hex"));
             console.log("--------------------");
             console.log("counter:" + counter.toString("hex"));
             console.log("--------------------");
	     var signature = s.slice(5);
	     console.log("signature:" + signature.toString("hex"));
             console.log("--------------------");
	     var clientDataStr = URLSafeBase64.decode(clientData64);
             var clientDataJSON = JSON.parse(clientDataStr);
	     console.log("client data:" + clientDataStr);
             console.log("challenge:" + clientDataJSON.challenge);
             console.log("--------------------");
           }catch(e){
             console.log("VERIFY_ERR : " + e);
           }

         if(clientDataJSON.challenge !== challenge){ fidoSampleWebFunction.goToIndex(req,res,"Verify is failed.(Challenge Unmatched)"); }

	 /* Verify Signature */
	 var cEnd = fidoSampleWebFunction.asnLen(signature);
	 if (cEnd !== signature.length) { fidoSampleWebFunction.goToIndex(req,res,"Invalid Request(signatureData has extra bytes)"); }
         
	 const a_hash = crypto.createHash('sha256');
 	 var appIdHash = a_hash.update("https://kirimanjirou.com:3334").digest();

         const c_hash = crypto.createHash('sha256');
	 var clientData = new Buffer (clientData64, 'base64');
         var clientDataHash = c_hash.update(clientData).digest();

	 var signatureBase = Buffer.concat([appIdHash, userPresenceFlag, counter, clientDataHash]);
	 console.log("signatureBase:");
	 console.log(signatureBase.toString("hex"));
	 console.log("--------------------");         

         publicKeyBuf = new Buffer(publicKey, 'base64');
         console.log("publicKeyBuf:")
         console.log(publicKeyBuf.toString("hex"));
         console.log("BufLength:" + publicKeyBuf.length);
         //add ASN1 format.
         publicKeyBufConstASN =  Buffer.concat([ new Buffer("3059301306072a8648ce3d020106082a8648ce3d030107034200", "hex"), publicKeyBuf]);
         console.log("--------------------");

         var pemStr = "-----BEGIN PUBLIC KEY-----\n";
  	 for (var certStr = publicKeyBufConstASN.toString('base64'); certStr.length > 64; certStr = certStr.slice(64))
  	 pemStr += certStr.slice(0, 64) + '\n';
 	 pemStr += certStr + '\n';
 	 pemStr += "-----END PUBLIC KEY-----\n";
	 userPublicKey = pemStr;

         console.log("userPublicKey:");
         console.log(userPublicKey);

	 const verify = crypto.createVerify("RSA-SHA256");
  	 verify.update(signatureBase);
  	 var flag = verify.verify(userPublicKey, signature);

	 if (flag){
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
 	      fidoSampleWebFunction.goToIndex(req,res,"Verify is failed.");
	 }

      }else{
        fidoSampleWebFunction.goToIndex(req,res,"Invalid Request");
      }

    })

    .catch(function(error){
      console.log("ERR : " + error);
      fidoSampleWebFunction.goToIndex(req,res,"Invalid Request");
    });

});

module.exports = router;
