var express = require('express');
var router = express.Router();
var fidoSampleWebFunction = require('../fidoSampleWebFunction.js');
var pgp = require('pg-promise')();
var pg_config = require('../pg_config.js');
var db = pgp(pg_config.config);

router.get('/', function(req, res, next) {
});

router.post('/', function(req, res, next) {
  var registrationData = req.body.registrationData;
  var clientData = req.body.clientData;

var rs = require('jsrsasign');
var fs = require('fs');

var c = new Buffer(registrationData, 'base64');
var cc = c.toString("hex");

var buf1 = c.slice(0,1);
console.log("reserved byte is:");
console.log(buf1.readInt8());
var l = (buf1.readInt8());
if (l !== 5){ console.log("Length is Bad"); }

var buf2 = c.slice(1,66);
console.log("public key is:");
console.log(buf2.toString("hex"));
var publicKeyHex = buf2.toString("hex");

var buf3 = c.slice(66,67);
console.log("keyhandle length is:");
console.log(buf3.readInt8());
var keyhandleLength = buf3.readInt8();

var buf4End = 67 + keyhandleLength;
var buf4 = c.slice(67,buf4End);
console.log("keyhandle is:");
console.log(buf4.toString("base64"));
var keyHandleHex = buf4.toString("base64");

var buf5 = c.slice(buf4End);

console.log("X.509:");
console.log(buf5.toString("hex"));
console.log(buf5.length);
var X509Hex = buf5.toString("hex");
console.log(rs.ASN1HEX.dump(X509Hex.toString("hex")));

db.query("UPDATE users SET (u2f_keyhandle,u2f_publickey) = (" + "'" + keyHandleHex + "','" + publicKeyHex + "') WHERE oid =" +  req.session.user_id + ";")
	.then(function(){
          fidoSampleWebFunction.goToUsers(req,res,"Server stored your PublickKey...Logout than try to FIDO Authentication.");
	})
	.catch(function(error){
          console.log("DB_ERR : " + error );
          fidoSampleWebFunction.goToUsers(req,res,error);
	});


});

module.exports = router;
