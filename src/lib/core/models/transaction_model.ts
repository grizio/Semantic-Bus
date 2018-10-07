'use strict';
////console.log(__filename);
var mongoose = require('../db/mongo_client');
var transactionSchema = require('../model_schemas/transaction_schema');

module.exports = mongoose.model('Transaction', transactionSchema);
