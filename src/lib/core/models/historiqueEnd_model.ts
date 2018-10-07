'use strict';
////console.log(__filename);
var mongoose = require('../db/mongo_client');
var historiqueEndShema = require('../model_schemas/historiqueEnd_shema');

module.exports = mongoose.model('historiqueEnd', historiqueEndShema);
