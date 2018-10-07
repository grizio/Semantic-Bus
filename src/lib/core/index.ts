'use strict';

var user = require('./lib/index').user;
var inscription = require('./lib/index').inscription;
var authentification = require('./lib/index').authentification;
var workspace = require('./lib/index').workspace;
var workspaceComponent = require('./lib/index').workspaceComponent;
var error = require('./lib/index').error;
// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------

module.exports = {
    user: user,
    authentification: authentification,
    inscription: inscription,
    workspace: workspace,
    workspaceComponent: workspaceComponent,
    error : error
};
