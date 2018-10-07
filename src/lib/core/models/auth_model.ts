'use strict';
////console.log(__filename);
var mongoose = require('../db/mongo_client');
var AuthenticationSchema = require('../model_schemas/auth_schema');

module.exports = mongoose.model('authentication', AuthenticationSchema);
