'use strict';
var config2 = require('../../../../configuration.js');
// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------

// @ts-ignore
var mongoose = require('mongoose',{useMongoClient: true});
mongoose.Promise = Promise;

var conStr = config2.mlabDB;
////console.log('config | ',config2);

//mongoose.connect(conStr);

//var db = mongoose.connection;
var db = mongoose.createConnection(conStr,{ useMongoClient: true})
//var __setOptions = mongoose.Query.prototype.setOptions;

// mongoose.Query.prototype.setOptions = function(options, overwrite) {
//   __setOptions.apply(this, arguments);
//   //console.log(this.options);
//   if (this.options.lean == null) this.options.lean = true;
//   return this;
// };
// CONNECTION EVENTS
// When successfully connected
db.on('connected', function () {
  console.log('Mongoose default connection open to ' + conStr);
});

// If the connection throws an error
db.on('error',function (err) {
  console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
db.on('disconnected', function () {
  //console.log('Mongoose default connection disconnected');
});

module.exports = db;
