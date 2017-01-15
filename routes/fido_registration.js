var express = require('express');
var router = express.Router();
var fidoSampleWebFunction = require('../fidoSampleWebFunction.js');
var pgp = require('pg-promise')();
var pg_config = require('../pg_config.js');
var db = pgp(pg_config.config);
var URLSafeBase64 = require('urlsafe-base64');
var crypto = require('crypto');

router.get('/', function(req, res, next) {
});

router.post('/', function(req, res, next) {
 
  try{
  var registrationData = req.body.registrationData;
  var clientData = new Buffer(req.body.clientData, 'base64');
  var clientDataStr = URLSafeBase64.decode(req.body.clientData);
  var clientDataJSON = JSON.parse(clientData);

  }catch(err){
   fidoSampleWebFunction.goToUsers(req,res,"Invalid Request(Parameter)"); 
  } 

  if(clientDataJSON.challenge !== req.session.challenge){ fidoSampleWebFunction.goToUsers(req,res,"Verify is failed.(Challenge Unmatched)"); }

  try{
 	 var rs = require('jsrsasign');
 	 var fs = require('fs');
	
	  var c = new Buffer(registrationData, 'base64');
	  var cc = c.toString("hex");
	  console.log("-------------------")
	
	  // reserved byte check.
	  var buf1 = c.slice(0,1);
	  console.log("reserved byte is:");
	  console.log(buf1.readInt8());
	  var l = (buf1.readInt8());
	  if (l !== 5){ fidoSampleWebFunction.goToUsers(req,res,"Invalid  Request(Reserve Byte Error)"); }
	  console.log("-------------------")

	  // getting public Key of user registration.
	  var buf2 = c.slice(1,66);
	  console.log("public key is:");
	  console.log(buf2.toString("base64"));
	  console.log("--------");
	  console.log("public key(hex) is:");
	  console.log(buf2.toString("hex"));
	  var publicKey = buf2;
	  console.log("--------");
	  var publicKey64 = buf2.toString("base64").replace(/\+/g,'-').replace(/=/g, '');
	  console.log("public key(websafe64) is:");
	  console.log(publicKey64);
	  console.log("-------------------")

	  // getting keyhandle of user registration.
	  var buf3 = c.slice(66,67);
	  console.log("keyhandle length is:");
	  console.log(buf3.readInt8());
	  var keyhandleLength = buf3.readInt8();
	  console.log("--------")
	  var buf4End = 67 + keyhandleLength;
	  var buf4 = c.slice(67,buf4End);
	  var keyHandle = buf4;
	  var keyHandle64 = URLSafeBase64.encode(buf4);
	  console.log("keyhandle(base64) is:");
	  console.log(keyHandle64);
	  console.log("-------------------")
	
	  // getting certificate(X.509) of authenticator.
	  var buf5 = c.slice(buf4End);
	  console.log("ASN1.data:");
	  console.log(rs.ASN1HEX.dump(buf5.toString("hex")));
	  console.log("--------")
	  console.log("ASN1.length:")
	  var buf5End = fidoSampleWebFunction.asnLen(buf5);
	  console.log(buf5End);
	  console.log("--------")
	  console.log("X.509:");
	  var certificate = buf5.slice(0,buf5End);
	  var pemStr = "-----BEGIN CERTIFICATE-----\n";
	  for (var certStr = certificate.toString('base64'); certStr.length > 64; certStr = certStr.slice(64))
	  pemStr += certStr.slice(0, 64) + '\n';
	  pemStr += certStr + '\n';
	  pemStr += "-----END CERTIFICATE-----\n";
	  var certificate64 = pemStr;
	  console.log(certificate64);
	  console.log("-------------------")
	
	  // getting signature
	  var buf6 = buf5.slice(buf5End);
	  console.log("signature:");
	  console.log(buf6.toString("hex"));
	  console.log("--------")
	  console.log("ASN1.data:");
	  console.log(rs.ASN1HEX.dump(buf6.toString("hex")));
	  console.log("--------")
	  console.log("ASN1.length:")
	  var buf6End = fidoSampleWebFunction.asnLen(buf6);
	  console.log(buf6End);
  }catch(err){
    fidoSampleWebFunction.goToUsers(req,res,"Invalid Request(" + err + ")" );	 
  }
	 if ( buf6End !== buf6.length) { fidoSampleWebFunction.goToUsers(req,res,"Invalid Request(registrationData has extra bytes)" ); }
	 var signature = buf6
	 console.log("-------------------")

	 var reservedByte = new Buffer('00', 'hex');

 	 // Hash data with sha256
 	 const a_hash = crypto.createHash('sha256');
	 var appIdHash = a_hash.update("https://kirimanjirou.com:3334").digest();

	 const c_hash = crypto.createHash('sha256');
	 var clientDataHash = c_hash.update(clientData).digest();

	 var signatureBase = Buffer.concat([reservedByte, appIdHash, clientDataHash, keyHandle, publicKey]);

	 console.log("signatureBase:");
	 console.log(signatureBase.toString("hex"));
 	 console.log("-------------------")

	 //Verify Registration
	 const verify = crypto.createVerify("RSA-SHA256");
  	 verify.update(signatureBase);
	 var flag = verify.verify(certificate64, signature);

 	 console.log ("VERIFY RESULT:");
	 console.log(flag);
	 console.log("-------------------")

	 if (flag){

		//Stored Registraion Data
		db.query("UPDATE users SET (u2f_keyhandle,u2f_publickey) = (" + "'" + keyHandle64 + "','" + publicKey64 + "') WHERE oid =" +  req.session.user_id + ";")
		.then(function(){
	          	  fidoSampleWebFunction.goToUsers(req,res,"Server stored your PublickKey...Logout than try to FIDO Authentication.");
		})
		.catch(function(error){
	          	  console.log("DB_ERR : " + error );
	          	  fidoSampleWebFunction.goToUsers(req,res,error);
		});

  	}else{
		fidoSampleWebFunction.goToUsers(req,res,"Invalid Request(Verify Error)")
  	}
});

module.exports = router;
