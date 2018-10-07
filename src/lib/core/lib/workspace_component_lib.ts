'use strict';
var workspaceComponentModel = require('../models/workspace_component_model');
// @ts-ignore
var workspaceModel = require('../models/workspace_model');
var historiqueEndModel = require("../models/historiqueEnd_model");
var historiqueStartModel = require("../models/historiqueStart_model");
// @ts-ignore
var config = require('../../../../configuration.js');
// @ts-ignore
var sift = require('sift');
//var workspaceBusiness = require('../../../webServices/workspaceBusiness')

// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------

module.exports = {
  create: _create,
  get: _get,
  update: _update,
  getConnectBeforeConnectAfter: _get_connectBefore_connectAfter,
  get_all_withConsomation: _get_all_withConsomation,
  get_all: _get_all,
  remove: _remove,
  get_component_result: _get_component_result
};

// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------


// @ts-ignore
function _create(workspaceComponents) {
  return new Promise(function(resolve, reject) {
    var componentArray = workspaceComponents
    if (Array.isArray(workspaceComponents) == false) {
      componentArray = []
      componentArray.push(workspaceComponents)
    }
    workspaceComponentModel.collection.insert(componentArray).then(savedComponents => {
      resolve(savedComponents.ops)
    }).catch(e => {
      reject(e)
    });
  })
}

// --------------------------------------------------------------------------------


// @ts-ignore
function _get(filter) {
  return new Promise(function(resolve, reject) {
    //console.log(filter);
    workspaceComponentModel.findOne(filter)
      .lean().exec(function(err, worksapceComponent) {
        //console.log("GET comp |",err,worksapceComponent);
        if (err) {
          reject(err)
        } else if (worksapceComponent == null) {
          resolve(undefined);
        } else {
          worksapceComponent.specificData = worksapceComponent.specificData || {}; //protection against empty specificData : corrupt data
          //console.log(worksapceComponent);
          resolve(worksapceComponent);
        }
      });
  })
} // <= _get

// --------------------------------------------------------------------------------

// @ts-ignore
function _get_all(filter) {
  return new Promise(function(resolve, reject) {
    workspaceComponentModel.find(filter, {
        'consumption_history': 0
      })
      .lean().exec(function(err, workspaceComponents) {
        if (err) {
          reject(err)
        } else {
          workspaceComponents.forEach(c => {
            c.specificData = c.specificData || {}
          }); //protection against empty specificData : corrupt data
          for (let comp of workspaceComponents) {
            if(comp.specificData.transformObject!=undefined && comp.specificData.transformObject.desc!=undefined){
              console.log('YYYYYYYYYYYYYYYYY',encodeURI(comp.specificData.transformObject.desc));
            }
          }

          resolve(workspaceComponents);
        }
      });
  })
} // <= _get_all


function _get_all_withConsomation(filter) {
  return new Promise(function(resolve, reject) {
    workspaceComponentModel.find(filter)
      .lean().exec(function(err, workspaceComponents) {
        if (err) {
          reject(err)
        } else {
          workspaceComponents.forEach(c => {
            c.specificData = c.specificData || {}
          }); //protection against empty specificData : corrupt data


          resolve(workspaceComponents);
        }
      });
  })
} // <= _get_all


// --------------------------------------------------------------------------------



function _get_connectBefore_connectAfter(filter) {
  return new Promise(function(resolve, reject) {
    workspaceComponentModel.findOne(filter, {
        'consumption_history': 0
      })
      .populate('connectionsBefore')
      .populate('connectionsAfter')
      .lean().exec(function(err, worksapceComponent) {
        if (err) {
          reject(err)
        } else {
          worksapceComponent.specificData = worksapceComponent.specificData || {};
          ////console.log("connectionBefore", worksapceComponent)
          resolve(worksapceComponent);
        }
      });
  })
} // <= _get_connectBefore_connectAfter

// --------------------------------------------------------------------------------

// @ts-ignore
function _update(componentToUpdate) {
  ////console.log('ALLLO',componentToUpdate);
  return new Promise((resolve, reject) => {
    if (config.quietLog != true) {
      ////console.log("update component");
    }
    try {
      //      resolve(componentToUpdate);
      workspaceComponentModel.findOneAndUpdate({
        _id: componentToUpdate._id
      }, componentToUpdate, {
        upsert: true,
        new: true
      }).lean().exec((err, componentUpdated) => {
        if (err) {
          if (config.quietLog != true) {
            ////console.log("update component failed");
          }
          reject(err);
        } else {
          if (config.quietLog != true) {
            //console.log("update component done", componentUpdated);
          }
          ////console.log("in resolve")
          resolve(componentUpdated)
        }
      });
    } catch (e) {
      if (config.quietLog != true) {
        ////console.log('EXCEPTION');
      }
    }
  });

  //
  //
  // //console.log("update component |", componentToUpdate);
  // return new Promise(function (resolve, reject) {
  //   workspaceComponentModel.findOne({
  //       _id: componentToUpdate._id
  //     })
  //     .exec(function (err, worksapceComponent) {
  //       if (err) {} else {
  //         return new Promise(function (resolve, reject) {
  //           if (componentToUpdate.connectionsAfter) {
  //             componentToUpdate.connectionsAfter.forEach(function (connectionsAfter) {
  //               if (connectionsAfter) {
  //                 if (worksapceComponent.connectionsAfter.indexOf(connectionsAfter._id.toString()) == -1) {
  //                   worksapceComponent.connectionsAfter.push(connectionsAfter._id)
  //                 }
  //               }
  //             })
  //           }
  //           if (componentToUpdate.connectionsBefore) {
  //             componentToUpdate.connectionsBefore.forEach(function (connectionsBefore) {
  //               if (connectionsBefore) {
  //                 if (worksapceComponent.connectionsBefore.indexOf(connectionsBefore._id.toString()) == -1) {
  //                   worksapceComponent.connectionsBefore.push(connectionsBefore._id)
  //                 }
  //               }
  //             })
  //           }
  //           if (componentToUpdate.specificData != null) {
  //             worksapceComponent.specificData = componentToUpdate.specificData
  //           }
  //
  //           resolve(worksapceComponent)
  //           //console.log("BEFORE SAVE", worksapceComponent)
  //         }).then(function (worksapceCompone) {
  //           worksapceComponent.save(function (err, worksapceComponent) {
  //             if (err) return handleError(err);
  //             workspaceComponentModel.findOne({
  //                 _id: worksapceComponent._id
  //               })
  //               .populate('connectionsAfter')
  //               .populate('connectionsBefore')
  //               .exec(function (err, component) {
  //                 //console.log("EXEC DONE", component)
  //                 if (err) throw TypeError(err)
  //                 component.connectionsAfter.forEach(function (connectionAfter) {
  //                   //console.log("CONNECT AFTER", connectionAfter)
  //                   if (connectionAfter.connectionsBefore == null) {
  //                     connectionAfter.connectionsBefore = []
  //                   }
  //                   if (connectionAfter.connectionsBefore.indexOf(worksapceComponent._id.toString()) == -1) {
  //                     connectionAfter.connectionsBefore.push(worksapceComponent._id)
  //                     connectionAfter.save(function (err, worksapce) {
  //                       if (err) return handleError(err);
  //                     })
  //                   }
  //                 })
  //                 component.connectionsBefore.forEach(function (connectionBefore) {
  //                   //console.log('CONNECT BEFORE', connectionBefore)
  //                   if (connectionBefore.connectionsAfter == null) {
  //                     connectionBefore.connectionsAfter = []
  //                   }
  //                   if (connectionBefore.connectionsAfter.indexOf(worksapceComponent._id.toString()) == -1) {
  //                     connectionBefore.connectionsAfter.push(worksapceComponent._id)
  //                     connectionBefore.save(function (err, worksapceComponent) {
  //                       if (err) return handleError(err);
  //                     })
  //                   }
  //                 })
  //                 //console.log("FINAL SAVE", worksapceComponent)
  //                 resolve(component)
  //               })
  //           })
  //         })
  //       }
  //     })
  // });
} // <= _update

function _remove(componentToDelete) {
  return new Promise((resolve, reject) => {
    //console.log(componentToDelete);
    workspaceModel.findOne({
        "components": componentToDelete._id
      }, {
        'consumption_history': 0,
      })
      // .populate({
      //   path: 'components',
      //   select: '-consumption_history'
      // })
      // .lean()
      .exec((err, workspace) => {
        if (err || workspace == null) {
          reject(err != undefined ? err : new Error('no worksapce for this component'));
        } else {
          //replace empty object by real
          // componentToDelete = sift({
          //   _id: componentToDelete._id
          // }, workspace.components)[0];
          workspaceComponentModel.remove({
            _id: componentToDelete._id
          }).exec((err, res) => {
            if (err) {
              reject(err)
            } else {
              //console.log('linksbefore',workspace.links);
              workspace.links=sift({$and:[{source:{$ne:componentToDelete._id}},{target:{$ne:componentToDelete._id}}]},workspace.links);
              //console.log('linksafter',workspace.links);
              workspace.save();
              resolve(componentToDelete);
              //workspace.links={}
              // let promises = [];
              // sift({
              //   "connectionsAfter": componentToDelete._id
              // }, workspace.components).forEach(beforeComp => {
              //   beforeComp.connectionsAfter.splice(beforeComp.connectionsAfter.indexOf(componentToDelete._id), 1);
              //   //beforeComp.connectionsAfter=sift({_id:{$ne:componentToDelete._id}},beforeComp.connectionsAfter);
              //   promises.push(this.update(beforeComp))
              // });
              //
              // sift({
              //   "connectionsBefore": componentToDelete._id
              // }, workspace.components).forEach(afterComp => {
              //   afterComp.connectionsBefore.splice(afterComp.connectionsBefore.indexOf(componentToDelete._id), 1);
              //   //afterComp.connectionsBefore=sift({_id:{$ne:componentToDelete._id}},afterComp.connectionsBefore);
              //   promises.push(this.update(afterComp))
              // });
              //
              // workspace.components.splice(workspace.components.indexOf(componentToDelete), 1);
              // promises.push(workspaceModel.findOneAndUpdate({
              //   _id: workspace._id
              // }, workspace).exec());
              //
              // Promise.all(promises).then(data => {
              //   resolve(componentToDelete);
              // }).catch(err => {
              //   reject(err);
              // });
            }
          })
        }
      });
  });
} // <= remove

// --------------------------------------------------------------------------------
function _get_component_result(componentId, processId) {
  return new Promise((resolve, reject) => {
    historiqueEndModel.findOne({
        processId: processId,
        componentId: componentId
      })
      .lean()
      .exec((err, historiqueEnd) => {
        if (err) {
          reject(err);
        } else {
          resolve(historiqueEnd);
        }
      })
  })
}
