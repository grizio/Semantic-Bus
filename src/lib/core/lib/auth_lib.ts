'use strict';

// const jwt = require('jsonwebtoken');
var jwt = require('jwt-simple');

var moment = require('moment');
// @ts-ignore
var bcrypt = require('bcryptjs');
var passport = require('passport');
// @ts-ignore
var userModel = require('../models/user_model');
var authenticationModel = require('../models/auth_model');

// @ts-ignore
var config = require('../../../../configuration');

// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------

module.exports = {
  create: _create,
  get_decoded_jwt: _get_decoded_jwt,
  require_token: _require_token,
  security_API: _security_API,
  google_auth: _google_auth,
  google_auth_callbackURL: _google_auth_callbackURL,
  google_auth_statefull_verification: _google_auth_statefull_verification
};

// --------------------------------------------------------------------------------
// create ==  1 + 2
// 1 - password
// 2 -  token + authentication model

// <-------------------------------------------  Create Auth  ------------------------------------------->

// @ts-ignore
function _create(bodyParams) {
  return new Promise(function(resolve, reject) {
    _is_google_user(bodyParams.authentication).then(function(boolean) {
      if (boolean == true) {
        if (config.quietLog != true) {
          //console.log("google user");
        }
        reject("google_user");
      } else {
        _create_preprocess(bodyParams.authentication).then(function(preData) {
          _create_mainprocess(preData, bodyParams.authentication).then(function(token) {
            resolve(token)
          }).catch(function(err) {
            reject(err)
          })
        }).catch(function(err) {
          reject(err)
        })
      }
    })
  })
} // <= _create


// --------------------------------------------------------------------------------

// @ts-ignore
function _create_preprocess(authenticationParams) {
  function auth_find_promise() {
    return new Promise(function(resolve, reject) {
      userModel.findOne({
          'credentials.email': authenticationParams.email
        }).lean().exec(function(err, userData) {
          if (userData) {
            resolve(userData)
          } else {
            reject("no_account_found");
          }
        });
    })
  }

  function bcrypt_promise(userData) {
    return new Promise(function(resolve, reject) {
      if (config.quietLog != true) {
        //console.log("userData ---------", userData)
      }
      bcrypt.compare(authenticationParams.password, userData.credentials.hashed_password, function(err, isMatch) {
        if (err) {
          console.log("compare_bcrypt ERRO -------")
          reject("compare_bcrypt");
        } else {
          console.log("isMatch")
          resolve(isMatch)
        }
      })
    })
  }

  return new Promise(function(resolve, reject) {
    auth_find_promise().then(function(userData) {
      bcrypt_promise(userData).then(function(result) {
        console.log("in result", result)
        if (result) {
          resolve(userData)
        }else{
          reject("compare_bcrypt")
        }
      }, function(err) {
        if (config.quietLog != true) {
          //console.log("--- bcrypt error ----", err)
        }
        reject(err)
      })
    }, function(err) {
      if (config.quietLog != true) {
        //console.log("--- authentification error ----", err)
      }
      reject(err)
    })
  })
} // <= _create_preprocess


// --------------------------------------------------------------------------------

// @ts-ignore
function _create_mainprocess(user, authenticationParams) {
  const payload = {
    exp: moment().add(14, 'days').unix(),
    iat: moment().unix(),
    iss: user._id,
    subject: user.googleid,
  }
  console.log("in authentification")
  var token = jwt.encode(payload, config.secret);

  var authentication = new authenticationModel({
    user: user._id,
    token: token,
    dates: {
      created_at: new Date()
    }
  });
  //console.log(authentication)
  return new Promise(function(resolve, reject) {
    authentication.save(function(err, authenticationData) {
      if (err) {
        throw TypeError(err);
      } else {
        //console.log(authenticationData)
        resolve(authenticationData)
      }
    });
  })
} // <= _create_mainprocess


// <-------------------------------------------  Google Auth  ------------------------------------------->


function _google_auth(router) {
  router.get('/google',
    passport.authenticate('google', {
      scope: ['email', 'profile']
    }));
} // <= _google_auth


function _google_auth_callbackURL(router, redirect_url) {
  router.get('/',
    passport.authenticate('google', {
      failureRedirect: '/login.html',
      session: false
    }),
    function(req, res) {
      //console.log('final request',req);
      res.redirect(redirect_url + res.req.user.googleToken);
    });
} // <= _google_auth_callbackURL


// --------------------------------------------------------------------------------


function _google_auth_statefull_verification(router) {
  router.post('/google_auth_statefull_verification', function(req, res) {
    if (config.quietLog != true) {
      //console.log("in callback")
      //console.log(req.body)
    }
    if (req.body.token != null) {
      userModel.findOne({
        googleToken: req.body.token
      }).lean().exec(function(err, user) {
        if (config.quietLog != true) {
          //console.log("--- google user find ---", user)
        }
        if (user) {
          user.googleToken = null;
          user.active = true
          //console.log(user)
          userModel.findByIdAndUpdate(user._id, user, function(err, user_update) {
            if (err) {
              throw err;
            }
            const payload = {
              exp: moment().add(14, 'days').unix(),
              iat: moment().unix(),
              iss: user._id,
              subject: user.googleid,
            }
            var token = jwt.encode(payload, config.secret);
            if (config.quietLog != true) {
              //console.log("--- token user ---", token)
            }
            res.send({
              user: user_update,
              token: token
            });
          });
        } else {
          res.send("create account please");
        }
      })
    }
  })
} // <= _google_auth_statefull_verification

// --------------------------------------------------------------------------------

// @ts-ignore
function _is_google_user(user) {
  return new Promise(function(resolve, reject) {
    userModel.findOne({
        'credentials.email': user.email
      })
      .exec(function(err, userData) {
        if (userData) {
          if (userData.googleId != null) {
            resolve(true)
          } else {
            resolve(false)
          }
        } else {
          resolve(false)
        }
      })
  })
} // <= _is_google_user



// <-------------------------------------------  Security  ------------------------------------------->


function _get_decoded_jwt(token) {
  try {
    var decodedToken = jwt.decode(token, config.secret);

    if (token.exp <= Date.now()) {
      return false;
    }
    return decodedToken;
  } catch (err) {
    return false;
  }
} // <= _get_decoded_jwt


// --------------------------------------------------------------------------------

function _require_token(token) {
  // @ts-ignore TS2554: Expected 1 arguments, but got 2.
  return new Promise(function(resolve, reject) {
    ////console.log(token);
    if (token == null) {
      resolve(false)
    } else {
      ////console.log("in service jwt", token );
      var decodedToken = jwt.decode(token, config.secret)
      ////console.log(decodedToken)
      if (token.exp <= Date.now()) {
        resolve(false);
      }
      resolve(decodedToken)
    }
  }, function(err) {
    if (config.quietLog != true) {
      //console.log("-------- promise catch auth lib --------", err)
    }
    // @ts-ignore TS2304: Cannot find name 'reject'.
    reject(false)
  })
} // <= require_token


// --------------------------------------------------------------------------------

function _security_API(req, res, next) {
  var token = req.body.token || req.query.token || req.headers['authorization']
  if (token != undefined) {
    token.split("");
    var decodedToken = jwt.decode(token.substring(4, token.length), config.secret);
    if (decodedToken.iss == null) {
      return res.json({
        success: false,
        message: 'Failed to authenticate token.'
      });
    } else {
      req.decoded = decodedToken;
      next();
    }
  } else {
    if (config.quietLog != true) {
      //console.log('No token provided');
    }
    return res.status(403).send({
      success: false,
      message: 'No token provided'
    });
  }
} // <= _security_API
