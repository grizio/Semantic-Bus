'use strict';
////console.log(__filename);
var mongoose = require('../db/mongo_client');
var WorkspaceSchema = require('../model_schemas/workspace_schema');
// var WorkspaceSchema = require('../model_schemas/workspace').workspace;

module.exports = mongoose.model('workspace', WorkspaceSchema);
