var jwtService = require('./jwtService');
var inscription_lib_user = require('../lib/core/lib/inscription_lib')
var auth_lib_user = require('../lib/core/lib/auth_lib')


// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------



module.exports = function (router) {

  // -------------------------------------------------------------------------------

  router.post('/isTokenValid', function (req, res) {
    if (req.body.token) {
      jwtService.require_token(req.body.token).then(function (token_result) {
        if (token_result != false) {
          res.send(token_result);
        } else {
          res.send(false)
        }
      })
    }
  }); // <= isTokenValid

  // --------------------------------------------------------------------------------

  router.post('/inscription', function (req, res) {
    inscription_lib_user.create({
      user: {
        name: req.body.name,
        job: req.body.job,
        society: req.body.society,
        email: req.body.emailInscription,
        passwordConfirm: req.body.confirmPasswordInscription,
        password: req.body.passwordInscription
      }
    }).then(function (data) {
      if (data.google != null) {
        res.send({
          data: true
        })
      } else {
        res.send({
          user: data.user,
          token: data.token.token
        });
      }
    }).catch(function (err) {
      res.send(err)
    })
  }); // <= inscription

  // --------------------------------------------------------------------------------

  router.post('/authenticate', function (req, res) {
	console.log("authenticate --")
    auth_lib_user.create({
      authentication: {
        email: req.body.email,
        password: req.body.password
      }
    }).then(function (data) {
	  console.log("authenticate =====>" ,data)
	  if(data == "no_account_found"){
		res.send({
			data: false
		  })
	  }
	  if (data.google != null) {
        res.send({
          data: true
        })
      } else {
		res.send({
			user: data.user,
			token: data.token
		});
		}
    }).catch(function (err) {
      res.send(err)
    })
  }); // <= authentification

  //<-------------------------------------   GOOGLE AUTH   ------------------------------------->

  auth_lib_user.google_auth(router)

  // --------------------------------------------------------------------------------


  auth_lib_user.google_auth_callbackURL(router, './login.html?google_token=')

  // --------------------------------------------------------------------------------


  auth_lib_user.google_auth_statefull_verification(router)

  // --------------------------------------------------------------------------------


}