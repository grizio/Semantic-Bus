'use strict';
////console.log(__filename);
var mongoose = require('../db/mongo_client');
var CacheSchema = require('../model_schemas/cache_schema');

module.exports = mongoose.model('cache', CacheSchema);
