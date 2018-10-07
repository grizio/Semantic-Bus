'use strict';
////console.log(__filename);
var mongoose = require('../db/mongo_client');
var processShema = require('../model_schemas/process_schema');

module.exports = mongoose.model('process', processShema);
