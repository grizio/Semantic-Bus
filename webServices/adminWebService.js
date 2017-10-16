var error_lib = require('../lib/core').error

// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------



module.exports = function(router) {


  // --------------------------------------------------------------------------------

  router.get('/errors', function(req, res, next) {
    error_lib.getAll().then(function(errors) {
      res.json(errors)
    }).catch(e => {
      next(e);
    })
  });
}
