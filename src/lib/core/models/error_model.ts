'use strict';
////console.log(__filename);
var mongoose = require('../db/mongo_client');
var errorSchema = require('../model_schemas/error_schema');

module.exports = mongoose.model('error', errorSchema);
