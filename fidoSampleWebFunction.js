var moment = require('moment');

exports.goToUsers = function(req,res,errMsg){
  var fidoSampleWebFunction = require('./fidoSampleWebFunction.js');
  var username = req.session.username;
  var user_email = req.session.user_email;
  var challenge = fidoSampleWebFunction.getUniqueStr();
  req.session.challenge = challenge;
  res.render('users', { err: errMsg,
                        username: username,
                        user_email: user_email,
			challenge: challenge
  });
};

exports.goToIndex = function(req,res,errMsg){
  var fidoSampleWebFunction = require('./fidoSampleWebFunction.js');
  var challenge = fidoSampleWebFunction.getUniqueStr();
  req.session.challenge = challenge;
  res.render('index', { err:  errMsg,
                        challenge: challenge
  });
};

exports.getUniqueStr = function(myStrong){
  var strong = 1000;
  if (myStrong) strong = myStrong;
  return new Date().getTime().toString(16)  + Math.floor(strong*Math.random()).toString(16)
};

exports.asnLen = function(buf) {
    if (buf.length < 2 || buf[0] != 0x30)
        throw new Error("Invalid data: Not a SEQUENCE ASN/DER structure");

    var len = buf[1];
    if (len & 0x80) { // long form
        var bytesCnt = len & 0x7F;
        if (buf.length < 2+bytesCnt)
            throw new Error("Invalid data: ASN structure not fully represented");
        len = 0;
        for (var i = 0; i < bytesCnt; i++)
            len = len*0x100 + buf[2+i];
        len += bytesCnt; // add bytes for length itself.
    }
    return len + 2; // add 2 initial bytes: type and length.
};
