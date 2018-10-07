'use strict';
////console.log(__filename);
var mongoose = require('../db/mongo_client');
var userSchema = require('../model_schemas/user_schema');

module.exports = mongoose.model('User', userSchema);
