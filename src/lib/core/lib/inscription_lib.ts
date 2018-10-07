var authenticationLib = require('./auth_lib')
var userLib = require('./user_lib')

// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------

module.exports = {
  create: _create
};


// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------

// create ==  identification + auth


// @ts-ignore
function _create(user_infos) {
  console.log("---- user lib connection ---", user_infos)
  if (user_infos.user == null) {
    throw TypeError("no user data");
  }

  function authenticationPromise(user) {
    return new Promise(function (resolve, reject) {
      authenticationLib.create({
        authentication: {
          email: user.user.email,
          password: user.user.password
        }
      }).then(function (token) {
        ////console.log(token)
        resolve(token)
      }).catch(function (err) {
        reject(err)
      })
    });
  }

  return new Promise(function (resolve, reject) {
    if (user_infos.user == null) {
      reject("no user data")
    }
    userLib.create(user_infos).then(function (userLibResult) {
      authenticationPromise(user_infos).then(function (token) {
        resolve({
          token: token,
          user: user_infos
        })
      }).catch(function (err) {
        reject(err)
      })
    }).catch(function (err) {
      console.log("IN ERROR", err)
      reject(err)
    })
  })

} // <= _create