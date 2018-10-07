'use strict';

module.exports = {

    user_model : require('../lib/core/models/index').user,
    workspace_model : require('../lib/core/models/index').workspace,
    workspaceComponent_model : require('../lib/core/models/index').workspaceComponent,
    cache_model : require('../lib/core/models/index').cache,
    config : require('../../configuration'),

    // --------------------------------------------------------------------------------
    // --------------------------------------------------------------------------------

    work : function(){
        this._migration_worskpace;
        this._migration_worskpace_component;
    },

    _migration_worskpace : function(){
        workspace_model.find().exec(function (err, workspaces) {
            workspaces.forEach((workspace_)=> {
                return new Promise((resolve, reject) => {
                    workspace_model.update(
                        {_id: workspace_._id},
                        {$unset: {consumption_history: null}},
                    ).exec((err, workspaceUpdate) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(workspaceUpdate);
                        }
                    });
                }).then((res)=>{
                    console.log('Update worskpace done', res)
                });
            });
        })
    },

    _migration_worskpace_component: function(){
        workspaceComponent_model.find().exec(function (err, workspaces_compo) {
            workspaces_compo.forEach((compo_)=> {
                return new Promise((resolve, reject) => {
                    workspaceComponent_model.update(
                        {_id: compo_._id},
                        {$unset: {consumption_history: null}},
                    ).exec((err, workspaceUpdate) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(workspaceUpdate);
                        }
                    });
                }).then((res)=>{
                    console.log('Update worskpace_component done', res)
                });
            });
        })
    }
}
