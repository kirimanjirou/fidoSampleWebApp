var moment = require('moment');

exports.goToUsers = function(req,res,errMsg){
  var username = req.session.username;
  var user_email = req.session.user_email;
  res.render('users', { err: errMsg,
                        username: username,
                        user_email: user_email
  });
};

exports.goToIndex = function(req,res,errMsg){
  var fidoSampleWebFunction = require('./fidoSampleWebFunction.js');
  var challenge = fidoSampleWebFunction.getUniqueStr();
  req.session.challenge = challenge
  res.render('index', { err:  errMsg,
                        challenge: challenge
  });
};

exports.getUniqueStr = function(myStrong){
  var strong = 1000;
  if (myStrong) strong = myStrong;
  return new Date().getTime().toString(16)  + Math.floor(strong*Math.random()).toString(16)
};
