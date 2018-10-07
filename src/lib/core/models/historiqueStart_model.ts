'use strict';
////console.log(__filename);
var mongoose = require('../db/mongo_client');
var historiqueStartShema = require('../model_schemas/historiqueStart_shema');

module.exports = mongoose.model('historiqueStart', historiqueStartShema);
