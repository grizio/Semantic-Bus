'use strict';
module.exports = {
  fragmentModel: require('../models/fragment_model'),
  PromiseOrchestrator: require('../helpers/promiseOrchestrator.js'),
  ArraySegmentator: require('../helpers/ArraySegmentator.js'),
  //promiseOrchestrator : new PromiseOrchestrator();
  objectSizeOf: require("object-sizeof"),


  //mongoose: require('mongoose'),
  frag: function(frag, key) {
    //console.log('XXXXXXX',frag);
    //remove all dependent fragments
    return new Promise((resolve, reject) => {
      //if(data instanceof Object){
      if (Array.isArray(frag.data)) {

        if (this.objectSizeOf(frag.data) > 1000) {
          //console.log('ARRAY BIG', key);
          let promiseOrchestrator = new this.PromiseOrchestrator();
          let arraySegmentator = new this.ArraySegmentator();

          let segmentation = arraySegmentator.segment(frag.data, 100)//100
          console.log('segment',segmentation.length);
          let paramArray = segmentation.map(s => {
            return [s.map(r=>{return {data:r}}), true]
          })
          //console.log('paramArray', paramArray);
          promiseOrchestrator.execute(this, this.persist, paramArray, {
            beamNb: 10//10
          }).then(persistSegments => {
            let arrayOut = [];
            let allFrags = [];
            if(persistSegments==undefined){
              console.log('persistSegments');
            }
            persistSegments.forEach((persistSegment,index) => {
              if(persistSegment==undefined){
                console.log('persistSegment undefined',key,index,paramArray[index],paramArray.length,persistSegments.length);
              }else{
                persistSegment.forEach(persistRecord => {
                  //console.log('persistRecord',JSON.stringify(persistRecord));
                  if (persistRecord._id != undefined) {
                    //console.log("_id",persistRecord._id);
                    arrayOut.push({
                      _frag: persistRecord._id
                    });
                    allFrags = allFrags.concat([persistRecord._id]);
                  } else {
                    arrayOut.push(persistRecord.data);
                  }
                  if (persistRecord.frags != undefined) {
                    allFrags = allFrags.concat(persistRecord.frags);
                  }
                });
              }

            });
            //console.log('ALLO?');
            resolve({
              frag: {
                data: arrayOut,
                frags: allFrags,
                _id: frag._id
              },
              key: key
            });
          })
        } else {
          //console.log('ARRAY SMALL', key);
          //console.log('NO PERSIST');
          resolve({
            frag: {
              data: frag.data,
              frags: [],
              _id: frag._id
            },
            key: key
          });
        }
      } else if (frag.data instanceof Object && key != '_id' && key != '_frag') {
        //console.log('OBJECT', key);
        let promiseStack = [];
        let objectOut = {};
        for (let key in frag.data) {
          //console.log('frag key', key);
          promiseStack.push(this.frag({
            data: frag.data[key]
          }, key));
        }
        // let persistValuesPromises = data.map((key, val) => {
        //   return this.frag(data[key], key);
        // });

        Promise.all(promiseStack).then(frags => {
          let allFrags = [];
          //console.log('AFTER OBJECT key frags',frags);
          //let out={data:data};
          if(frags==undefined){
            console.log('frags');
          }
          frags.forEach(fragAndKey => {
            objectOut[fragAndKey.key] = fragAndKey.frag.data;
            if (fragAndKey.frag.frags != undefined) {
              allFrags = allFrags.concat(fragAndKey.frag.frags);
            }
          });
          //out.frags = allFrags;
          resolve({
            frag: {
              data: objectOut,
              frags: allFrags,
              _id: frag._id
            },
            key: key
          });
        });
      } else {
        //console.log('PRIMITIV', key);
        resolve({
          frag: {
            data: frag.data,
            _id: frag._id
          },
          key: key
        });
      }


      // if (Array.isArray(data[key])) {
      //   data[key].forEach(record => {
      //     this.persist(record).then(fragment => {
      //       fragment
      //     });
      //   })
      // }
    })
  },
  persist: function(datas, createOnly) {
    //console.log('persist data frag', this.objectSizeOf(data));
    //console.log('persist data frag',datas);


    if (datas instanceof Object) {
      return new Promise((resolve, reject) => {


        let fragReadyPromises = [];
        let forceArray = false;
        if (!Array.isArray(datas)) {
          datas = [datas];
          forceArray = true;
        }
        fragReadyPromises = datas.map(data => {
          if (createOnly == true || data._id==undefined) {
            return new Promise((resolve, reject) => {
              resolve({
                data: data.data
              })
            })
          } else {
            return new Promise((resolve, reject) => {
              this.fragmentModel.findOne({
                _id: data._id
              }).lean().exec().then(fragment => {
                if (fragment != null) {
                  //console.log('EXISTING frag',fragment.frags);
                  this.fragmentModel.remove({
                    _id: {
                      $in: fragment.frags
                    }
                  }).exec();
                  fragment.data = data.data;
                } else {
                  fragment = {
                    data: data.data
                  }
                }
                resolve(fragment);
              });
            });
          }
        });
        Promise.all(fragReadyPromises).then(fragReadyFargs => {
          let persistReadyPromises = fragReadyFargs.map(f => {
            return this.frag(f)
          });
          return Promise.all(persistReadyPromises);
        }).then(persistReadyFargs => {
          //console.log('persistReadyFargs',persistReadyFargs);
          let createReadyFrags = [];
          let updateReadyFrags = [];
          let unpersistReadyFrags = [];
          if(persistReadyFargs==undefined){
            console.log('persistReadyFargs');
          }
          // @ts-ignore TS2322: Type 'void' is not assignable to type 'any[]'. TODO: why the reaffectation?
          persistReadyFargs = persistReadyFargs.forEach(persistReadyFarg => {
            //console.log('persistReadyFarg.frag.data',persistReadyFarg);
            if(!(persistReadyFarg.frag.data instanceof Object)){
              //console.log('ALLO2',persistReadyFarg.frag.data);
              unpersistReadyFrags.push(persistReadyFarg.frag);
            }else{
              if (persistReadyFarg.frag._id == undefined) {
                //console.log('ALLO0',persistReadyFarg.frag.data );
                createReadyFrags.push(new this.fragmentModel(persistReadyFarg.frag));
              } else{
                //console.log('ALLO1',persistReadyFarg.frag.data );
                updateReadyFrags.push(persistReadyFarg.frag);
              }
            }
            // if (persistReadyFarg.frag._id == undefined) {
            //   console.log('ALLO0',persistReadyFarg.frag.data );
            //   createReadyFrags.push(new this.fragmentModel(persistReadyFarg.frag));
            // } else if(persistReadyFarg.frag.data instanceof Object){
            //   console.log('ALLO1',persistReadyFarg.frag.data );
            //   updateReadyFrags.push(persistReadyFarg.frag);
            // } else {
            //   console.log('ALLO2');
            //   unpersistReadyFrags.push(persistReadyFarg.frag);
            // }
          })
          //console.log('TO PERSIST',createReadyFrags,JSON.stringify(updateReadyFrags));
          let insertPromiseStack = this.fragmentModel.insertMany(createReadyFrags, {
            new: true
          });
          let updatePromisesStack = updateReadyFrags.map(f => {
            return this.fragmentModel.findOneAndUpdate({
              _id: f._id
            }, f, {
              upsert: true,
              new: true
            }).lean().exec();
          })
          let upersistPromiseStack= new Promise((resolve,reject)=>{

            resolve(unpersistReadyFrags)
          })

          return Promise.all([insertPromiseStack, updatePromisesStack,upersistPromiseStack]);
        }).then(insertedAndUpdatedFrags => {
          //console.log('persistResult',insertedAndUpdatedFrags);
          let out = insertedAndUpdatedFrags[0].concat(insertedAndUpdatedFrags[1]).concat(insertedAndUpdatedFrags[2]);
          if (forceArray) {
            out = out[0];
          }
          //console.log('resolve0',out);
          resolve(out);

        });
      });

    } else {
      return new Promise((resolve, reject) => {
        //console.log('resolve1',datas);
        resolve(datas);
      })
    }


    // if (data instanceof Object) {
    //   return new Promise((resolve, reject) => {
    //     //remove all dependent fragments
    //     this.fragmentModel.findOne({
    //       _id: data._id
    //     }).lean().exec().then(fragment => {
    //       //console.log('finded fragment');
    //       if (fragment != null) {
    //         //console.log('EXISTING frag',fragment.frags);
    //         this.fragmentModel.remove({
    //           _id: {
    //             $in: fragment.frags
    //           }
    //         }).exec();
    //       }
    //       this.frag({
    //         data: data.data
    //       }).then(frag => {
    //         //console.log('fragmentation done');
    //         if (fragment == null) {
    //           fragment = new this.fragmentModel(frag);
    //           fragment._id = data._id;
    //         } else {
    //           fragment.data = frag.data;
    //           fragment.frags = frag.frags;
    //         }
    //         this.fragmentModel.findOneAndUpdate({
    //           _id: fragment._id
    //         }, fragment, {
    //           upsert: true,
    //           new: true
    //         }).lean().exec((err, newdata) => {
    //           if (err != null) {
    //             console.log('frag error', err);
    //           }
    //           //console.log('newdata', newdata._id);
    //           // // console.log(err);
    //           resolve(newdata);
    //         });
    //       })
    //     });
    //   });
    // } else {
    //   return new Promise((resolve, reject) => {
    //     resolve(data);
    //   })
    // }
  },
  get: function(id) {
    //console.log(" ------ in fragment component ------ ", id)
    return new Promise((resolve, reject) => {
      //console.log('cache', component);
      this.fragmentModel.findOne({
        _id: id
      }).lean().exec().then((fragmentReturn) => {
        //console.log('-------- FAGMENT LIB GET -------| ', fragmentReturn);
        resolve(fragmentReturn)
      }).catch(err => {
        console.log('-------- FAGMENT LIB ERROR -------| ', err);
        reject(err);
      });
    });
  },
  getWithResolution: function(id) {
    //console.log(" ------ in fragment component ------ ", id)
    return new Promise((resolve, reject) => {
      //console.log('cache', component);
      try {
        this.fragmentModel.findOne({
          _id: id
        }).lean().exec().then((fragmentReturn) => {
          if (fragmentReturn != null) {
            this.fragmentModel.find({
              _id: {
                $in: fragmentReturn.frags
              }
            }).lean().exec().then(framentParts => {
              try {
                let partDirectory = {}
                let partBinding = framentParts.forEach(frag => {
                  partDirectory[frag._id] = frag.data;
                });
                //console.log(partDirectory);

                let resolution = this.rebuildFrag(fragmentReturn.data, partDirectory);

                fragmentReturn.data = resolution;
                resolve(fragmentReturn);
              } catch (e) {
                reject(e);
              }
            })
          }else{
            resolve(null)
          }
        }).catch(err => {
          reject(err);
          console.log('-------- FAGMENT LIB ERROR -------| ', err);
        });
      } catch (e) {
        reject(e);
      }
    });
  },
  rebuildFrag: function(object, partDirectory) {
    if (object instanceof Object && object != null && object != undefined) {
      for (let key in object) {
        //console.log(key);
        if (key != '_id') {
          if (object[key] != null && object[key] != undefined && object[key]['_frag'] != undefined) {
            //console.log('ALLO');
            object[key] = this.rebuildFrag(partDirectory[object[key]['_frag']], partDirectory);
          } else {
            object[key] = this.rebuildFrag(object[key], partDirectory);
          }
        }
      }
    }
    return object;
  },
  cleanFrag: function(id) {
    //console.log('cleanFrag', id);
    this.fragmentModel.findOne({
      _id: id
    }).lean().exec().then(frag => {
      //console.log(frag);
      if (frag != null) {
        let fragsToDelete = frag.frags;
        fragsToDelete.push(frag._id);
        this.fragmentModel.remove({
          _id: {
            $in: fragsToDelete
          }
        }).exec();
      }
    })
  }

};
