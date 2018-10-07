'use strict';
module.exports = {
  cacheModel: require('../models/cache_model'),
  middle_service_workspace: require('../../../webServices/workspaceComponentPromise'),
  fragment_lib: require('./fragment_lib.js'),
  PromiseOrchestrator: require('../helpers/promiseOrchestrator.js'),
  //mongoose: require('mongoose'),
  persist: function(component, data, history) {
    //cachedData={};
    //console.log('CACHE LIB CREATE | ',data);
    return new Promise((resolve, reject) => {
      this.cacheModel.findOne({
        _id: component._id
      }).lean().exec().then(cachedData => {
        // console.log(cachedData);
        let fragment: any = {
          data: data
        };
        if (cachedData != null && history != true) {
          fragment._id = cachedData.frag;
        } else if (cachedData == null) {
          cachedData = {};
        }
        // console.log('before frag',fragment._id);
        this.fragment_lib.persist(fragment).then(frag => {
          //console.log('after frag frags',frag.frags);
          cachedData.frag = frag._id;
          cachedData.date = new Date();
          if (history == true) {
            cachedData.history = cachedData.history || [];
            cachedData.history.push({
              frag: frag._id,
              date: new Date()
            });
          }
          this.cacheModel.findOneAndUpdate({
              _id: component._id
            },
            cachedData, {
              upsert: true,
              new: true
            }).lean().exec().then((cacheReturn) => {
            resolve(cacheReturn);
          }).catch(err => {
            reject(err);
          });
        })
      }).catch(e => {
        reject(e);
      });
    });
  },

  get: function(component, resolveFrag) {
    //console.log(" ------ in cache component ------ ", component._id)
    let promiseOrchestrator = new this.PromiseOrchestrator();
    return new Promise((resolve, reject) => {
      this.cacheModel.findOne({
        _id: component._id
      }).lean().exec().then(cachedData => {
        if (cachedData != undefined) {
          if (component.specificData.historyOut != true) {
            if (cachedData.frag != undefined) {
              if (resolveFrag == true) {
                this.fragment_lib.getWithResolution(cachedData.frag).then(frag => {
                  //console.log('getWithResolution result', frag.data);
                  if(frag!=null){
                    resolve(frag.data);
                  }else{
                    reject(new Error('corrupted cache fragmentation'))
                  }
                }).catch(e => {
                  reject(e)
                })
              } else {
                this.fragment_lib.get(cachedData.frag).then(frag => {
                  if(frag!=null){
                    resolve(frag.data);
                  }else{
                    reject(new Error('corrupted cache fragmentation'))
                  }
                }).catch(e => {
                  reject(e)
                })
              }
            } else {
              reject(new Error("frag of cache doesn't exist"))
            }

          } else {
            let arrayParam = cachedData.history.map(r => [r.frag]);
            promiseOrchestrator.execute(this.fragment_lib, this.fragment_lib.get, arrayParam).then(arrayResult => {
              resolve(arrayResult);
            })
          }
        } else {
          resolve(undefined);
        }

      }).catch(err => {
        reject(err);
      });
    });
  }
};
