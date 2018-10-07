'use strict';
////console.log(__filename);
var mongoose = require('../db/mongo_client');
var FragmentSchema = require('../model_schemas/fragment_schema');

module.exports = mongoose.model('fragment', FragmentSchema);
