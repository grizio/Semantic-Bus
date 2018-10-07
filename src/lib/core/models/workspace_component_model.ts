'use strict';
////console.log(__filename);
var mongoose = require('../db/mongo_client');
var WorkspaceComponentSchema = require('../model_schemas/workspace_component_schema');

module.exports = mongoose.model('workspaceComponent', WorkspaceComponentSchema);
