
var mlab_token = require('../../configuration').mlab_token
var componentsCategoriesTree = require('./componentsCategoriesTree')

// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------


export default function technicalComponentWebService(router,unsafeRouter, app,stompClient) {

  // --------------------------------------------------------------------------------

  var technicalComponentDirectory = require('./technicalComponentDirectory.js');
  var recursivPullResolvePromise = require('./engine');
  technicalComponentDirectory.initialise(unsafeRouter,app, stompClient);


  router.get('/technicalComponent/', function(req, res) {

    res.json(technicalComponentDirectory.buildDictionnaryArray());
  });//<= get_technicalComponent

  router.get('/technicalComponent/componentsCategoriesTree', function (req, res,next) {
    res.json(componentsCategoriesTree);
  });

}
