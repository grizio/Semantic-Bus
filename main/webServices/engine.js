"use strict";

const ProcessNotifier = require('./ProcessNotifier')

class Engine {
  constructor(component, requestDirection, amqpClient, callerId, pushData, queryParams) {
    this.technicalComponentDirectory = require("./technicalComponentDirectory.js");
    this.sift = require("sift");
    //this.config_component = require("../configuration");
    this.objectSizeOf = require("object-sizeof");
    this.workspace_component_lib = require("../lib/core/lib/workspace_component_lib");
    this.workspace_lib = require("../lib/core/lib/workspace_lib");
    this.user_lib = require("../lib/core/lib/user_lib");
    this.config = require("../configuration.js");
    let PromiseOrchestrator = require("../lib/core/helpers/promiseOrchestrator.js")
    this.promiseOrchestrator = new PromiseOrchestrator();
    this.fackCounter = 0;
    this.amqpClient = amqpClient,
      this.callerId = callerId;
    this.originComponent = component;
    this.requestDirection = requestDirection;
    this.pushData = pushData;
    this.originQueryParams = queryParams;
  }

  resolveComponent() {


    return new Promise((resolve, reject) => {
      this.workspace_component_lib
        .get_all({
          workspaceId: this.originComponent.workspaceId
        })
        .then(components => {
          // for (let comp of components) {
          //   if(comp.specificData.transformObject!=undefined && comp.specificData.transformObject.desc!=undefined){
          //     console.log('YYYYYYYYYYYYYYYYY',encodeURI(comp.specificData.transformObject.desc));
          //   }
          // }

          this.componentsResolving = components;
          this.workspace_lib
            .getWorkspace(this.originComponent.workspaceId)
            .then(workflow => {
              this.workflow = workflow;
              //console.log('engine workflow',this.workflow);
              console.log('engine workflow user 2 | name',this.workflow.users,this.workflow.name);
              let ownerUserMail = this.sift({
                  role: "owner"
                },
                this.workflow.users
              )[0];


              //console.log(ownerUserMail)
              this.user_lib
                .get({
                  "credentials.email": ownerUserMail.email
                })
                .then(user => {

                  this.componentsResolving.forEach(component => {
                    //component.status = "waiting";
                    //empty object are not persist by mongoose
                    component.specificData = component.specificData || {};
                  });

                  this.originComponent = this.sift({
                      _id: this.originComponent._id
                    },
                    this.componentsResolving
                  )[0];

                  // if (this.config.quietLog != true) {
                    console.log(" ---------- Resolve Workflow -----------" , this.workflow.name , this.originComponent._id);
                  // }
                  this.pathResolution = this.buildPathResolution(
                    workflow,
                    this.originComponent,
                    this.requestDirection,
                    0,
                    this.componentsResolving,
                    undefined,
                    this.originQueryParams == undefined ? undefined : {
                      origin: this.originComponent._id,
                      queryParams: this.originQueryParams
                    },
                    undefined
                  );

                  if (this.config.quietLog != true) {
                    console.log(" ---------- BuildPath Links-----------", this.fackCounter)
                    console.log(this.pathResolution.links.map(link => {
                      //return (link.source);
                      return (link.source.component._id + ' : ' + link.source.queryParams + ' -> ' + link.target.component._id + ' : ' + link.target.queryParams);

                    }));
                    console.log(" ---------- BuildPath Nodes-----------", this.fackCounter)
                    console.log(this.pathResolution.nodes.map(node => {
                      return (node.component._id + ':' + node.queryParams);
                    }));
                  }


                  this.owner = user;

                  this.workspace_lib.createProcess({
                    workflowId: this.originComponent.workspaceId,
                    ownerId: this.owner._id,
                    callerId: this.callerId, //console.log(this.processCollection);
                    // } else {
                    //   this.trigger('ajax_fail', body.error);
                    // }
                    originComponentId: this.originComponent._id,
                    steps: this.pathResolution.nodes.map(node => ({ componentId: node.component._id }))
                  }).then((process) => {
                    this.processId = process._id;
                    this.processNotifier = new ProcessNotifier(this.amqpClient, this.originComponent.workspaceId)
                    this.processNotifier.start({
                      _id: this.processId,
                      callerId: this.callerId,
                      timeStamp: process.timeStamp,
                      steps: this.pathResolution.nodes.map(node => ({
                        componentId: node.component._id,
                        status: node.status
                      }))
                    })

                    this.pathResolution.links.forEach(link => {
                      link.status = "waiting";
                    });
                    //this.RequestOrigine = this.originComponent;
                    this.RequestOrigineResolveMethode = resolve;
                    this.RequestOrigineRejectMethode = reject;


                    /// -------------- push case  -----------------------
                    if (this.requestDirection == "push") {
                      //console.log("pushData",this.pushData);
                      let originNode = this.sift({
                        "component._id": this.originComponent._id
                      }, this.pathResolution.nodes)[0];
                      originNode.dataResolution = {
                        data: this.pushData
                      };
                      originNode.status = 'resolved';
                      //console.log(originNode);
                      this.historicEndAndCredit(originNode, new Date(), undefined)
                      // this.sift({
                      //     "source._id": component._id
                      //   },
                      //   this.pathResolution.links
                      // ).forEach(link => {
                      //   link.status = "processing";
                      // });

                      //this.processNextBuildPath('push');
                      resolve(this.pushData);
                    }

                    this.processNextBuildPath();
                  })
                });
            });
        });
    });
  }

  processNextBuildPath() {
    //console.log('processNextBuildPath 1');
    setTimeout(this.processNextBuildPathDelayed.bind(this), 100);
  }
  processNextBuildPathDelayed() {
    if (this.owner.credit >= 0) {

      this.fackCounter++;
      if (this.config.quietLog != true) {
        console.log(" ---------- processNextBuildPath -----------", this.fackCounter)
        // console.log(this.pathResolution.links.map(link => {
        //   return (link.source.component._id + ' -> ' + link.target.component._id + ' : ' + link.source.status + ' -> ' + link.target.status + ' ' + link.source.component.name);
        // }));
        console.log(this.pathResolution.nodes.map(node => {
          return (node.component._id + ' : ' + node.status + ' ' + node.component.name);
        }));
      }
      let processingNode = undefined;
      let nodeWithoutIncoming = this.sift({
          $and: [{
              sources: {
                $size: 0
              }
            },
            {
              status: 'waiting'
            }
          ]
        },
        this.pathResolution.nodes
      );
      if (nodeWithoutIncoming.length > 0) {
        //console.log('source component', nodeWithoutIncoming[0]);
        processingNode = nodeWithoutIncoming[0];
      } else {
        let nodeWithAllIncomingResolved = this.sift({
            status: 'waiting'
          },
          this.pathResolution.nodes
        );
        nodeWithAllIncomingResolved.every(n => {

          let nbSourcesResolved = this.sift({
            'source.status': 'resolved'
          }, n.sources).length;
          //console.log('source resolved size', nbSourcesResolved, n.sources.length);
          if (n.sources.length == nbSourcesResolved) {
            processingNode = n;
            return false;
          } else {
            return true;
          }
        })
      }
      //console.log('processingNode', processingNode);
      if (processingNode != undefined) {
        let startTime = new Date();
        //processingLink.status = 'processing';
        let nodesProcessingInputs = this.sift({
            "targets.target.component._id": processingNode.component._id,
            //  status: "processing"
          },
          this.pathResolution.nodes
        );

        let module = this.technicalComponentDirectory[
          processingNode.component.module
        ];
        let dataFlow = undefined;
        let primaryflow = undefined;
        let secondaryFlow = undefined;
        if (nodesProcessingInputs.length > 0) {
          //console.log('ALLO');
          dataFlow = nodesProcessingInputs.map(sourceNode => {
            let d = sourceNode.dataResolution;
            d.componentId = sourceNode.component._id;
            return d;
          });
          if (module.getPrimaryFlow != undefined) {
            primaryflow = module.getPrimaryFlow(
              processingNode.component,
              dataFlow
            );
          } else {
            primaryflow = dataFlow[0];
          }

          secondaryFlow = [];
          secondaryFlow = secondaryFlow.concat(dataFlow);
          secondaryFlow.splice(secondaryFlow.indexOf(primaryflow), 1);
        }

        //console.log("primaryflow", primaryflow);
        if (dataFlow != undefined && primaryflow == undefined) {
          let err = new Error("primary flow could not be identified");
          processingNode.status = "error";
          processingNode.dataResolution = {
            error: err
          };
          this.historicEndAndCredit(processingNode, startTime, err)
          this.processNextBuildPath('flow ko');
        } else {
          if (dataFlow != undefined && primaryflow.dfob != undefined) {
            try {
              //console.log("DFOB", primaryflow.dfob);
              var dfobTab = primaryflow.dfob[0].path.length > 0 ? primaryflow.dfob[0].path.split(".") : [];
              //console.log('dfob',dfobTab,primaryflow.dfob[0].keepArray);
              var dfobFinalFlow = this.buildDfobFlow(
                primaryflow.data,
                dfobTab,
                undefined,
                primaryflow.dfob[0].keepArray
              );
              //console.log('dfobFinalFlow',dfobFinalFlow);

              if (this.config.quietLog != true) {
                //console.log('dfobFinalFlow | ', dfobFinalFlow);
              }

              if (dfobFinalFlow.length == 0) {
                processingNode.dataResolution = {
                  data: primaryflow.data
                };
                processingNode.status = "resolved";
                this.historicEndAndCredit(processingNode, startTime, undefined)
                if (
                  processingNode.component._id == this.originComponent._id
                ) {
                  this.RequestOrigineResolveMethode(
                    processingNode.dataResolution
                  );

                }
                this.processNextBuildPath('dfob empty');
              } else {

                let paramArray = dfobFinalFlow.map(finalItem => {
                  var recomposedFlow = [];
                  //console.log(finalItem.objectToProcess,finalItem.key);
                  recomposedFlow = recomposedFlow.concat([{
                    data: finalItem.objectToProcess[finalItem.key],
                    componentId: primaryflow.componentId
                  }]);
                  recomposedFlow = recomposedFlow.concat(secondaryFlow);
                  //console.log('recomposedFlow',recomposedFlow);
                  return [
                    processingNode.component,
                    recomposedFlow,
                    processingNode.queryParams == undefined ? undefined : processingNode.queryParams.queryParams
                  ];
                });

                //console.log('paramArray',JSON.stringify(paramArray));

                this.promiseOrchestrator.execute(module, module.pull, paramArray, {
                  beamNb: 1
                }, this.config).then((componentFlowDfob) => {
                  //console.log('componentFlowDfob',componentFlowDfob);
                  for (var componentFlowDfobKey in componentFlowDfob) {
                    //console.log(componentFlowDfobKey);
                    dfobFinalFlow[componentFlowDfobKey].objectToProcess[
                        dfobFinalFlow[componentFlowDfobKey].key
                      ] =
                      componentFlowDfob[componentFlowDfobKey].data;
                  }
                  //console.log('dfobFinalFlow',dfobFinalFlow);
                  processingNode.dataResolution = {
                    //componentId: processingNode.component._id,
                    //data: dfobFinalFlow.map(FF=>FF.objectToProcess),
                    data: primaryflow.data
                  };
                  processingNode.status = "resolved";
                  this.historicEndAndCredit(processingNode, startTime, undefined)
                  if (
                    processingNode.component._id == this.originComponent._id
                  ) {
                    this.RequestOrigineResolveMethode(
                      processingNode.dataResolution
                    );

                  }

                  this.processNextBuildPath('dfob ok');
                }).catch(e => {
                  console.log('CATCH dfob', e);
                  processingNode.dataResolution = {
                    error: e
                  };
                  this.historicEndAndCredit(processingNode, startTime, e)
                  processingNode.status = "error";
                  this.processNextBuildPath('dfob ko');
                });
              }

            } catch (e) {
              console.log('CATCH dfob', e);
              processingNode.dataResolution = {
                error: e
              };
              this.historicEndAndCredit(processingNode, startTime, e)
              processingNode.status = "error";
              this.processNextBuildPath('dfob ko');
            }
          } else {
            //console.log("NORMAL", processingNode.component._id);
            module.pull(processingNode.component, dataFlow, processingNode.queryParams == undefined ? undefined : processingNode.queryParams.queryParams).then(componentFlow => {
              processingNode.dataResolution = componentFlow;
              processingNode.status = "resolved";
              this.historicEndAndCredit(processingNode, startTime, undefined)
              if (processingNode.component._id == this.originComponent._id) {
                this.RequestOrigineResolveMethode(
                  processingNode.dataResolution
                );
              }
              this.processNextBuildPath('normal ok');
            }).catch(e => {
              console.log('CATCH normal', processingNode.component._id, e);
              processingNode.dataResolution = {
                error: e
              };
              processingNode.status = "error";
              //console.log('HIST')
              this.historicEndAndCredit(processingNode, startTime, e)
              //console.log('NEXT');
              this.processNextBuildPath('normal ko');
            });
          }
        }


      } else {
        //console.log('END');
        let nodeOnError = this.sift({
            status: "error"
          },
          this.pathResolution.nodes
        );

        if (nodeOnError.length > 0) {
          this.processNotifier.error({ _id: this.processId })

          let errors = [];
          this.pathResolution.nodes.forEach(n => {
            if (n.dataResolution != undefined && n.dataResolution.error != undefined) {
              errors.push(n.dataResolution.error);
            }
          })
          this.RequestOrigineRejectMethode(errors);
          // }
        } else {
          this.processNotifier.end({ _id: this.processId })
        }
        this.workspace_lib.cleanOldProcess(this.workflow).then(processes => {
          // console.log(processes);
          this.processNotifier.processCleaned({ cleanedProcesses: processes })
        })
        if (this.config.quietLog != true) {
          console.log("--------------  End of Worksapce processing --------------");
        }
      }
    } else {
      const fullError = new Error("Vous n'avez pas assez de credit");
      this.processNotifier.error({
        _id: this.processId,
        error: fullError.message
      })
      this.RequestOrigineRejectMethode(fullError);
    }
  }


  historicEndAndCredit(processingNode, startTime, error) {

    // console.log('historicEndAndCredit',error);
    let dataFlow = processingNode.dataResolution
    //console.log('dataFlow',dataFlow);
    let module = processingNode.component.module;
    let specificData = processingNode.component.specificData;
    let historic_object = {};
    let current_component = this.config.components_information[module];
    let current_component_price;
    let roundDate = new Date();
    roundDate.setMinutes(0);
    roundDate.setSeconds(0);
    roundDate.setMilliseconds(0);
    roundDate.setHours(0);

    if (module.getPriceState != undefined) {
      current_component_price = module.getPriceState(specificData, current_component.price, current_component.record_price);
    } else {
      current_component_price = {
        moPrice: current_component.price,
        recordPrice: current_component.record_price
      }
    }
    current_component = this.config.components_information[module];

    historic_object.recordCount = dataFlow == undefined || dataFlow.data == undefined ? 0 : dataFlow.data.length || 1;
    historic_object.recordPrice = current_component_price.record_price || 0;
    historic_object.moCount = dataFlow == undefined || dataFlow.data == undefined ? 0 : this.objectSizeOf(dataFlow) / 1000000;
    historic_object.componentPrice = current_component_price.moPrice;
    historic_object.totalPrice =
      (historic_object.recordCount * historic_object.recordPrice) / 1000 +
      (historic_object.moCount * historic_object.componentPrice) / 1000;
    historic_object.componentModule = module
    //TODO pas besoin de stoquer le name du component, on a l'id. ok si grosse perte de perf pour histogramme
    historic_object.componentName = processingNode.component.name;
    historic_object.componentId = processingNode.component._id;
    historic_object.persistProcess = processingNode.component.persistProcess;
    historic_object.processId = this.processId;
    //historic_object.data = dataFlow.data;
    historic_object.error = error;
    historic_object.startTime = startTime;
    historic_object.roundDate = roundDate;
    historic_object.workflowId = this.originComponent.workspaceId;
    // console.log(historic_object);
    let persistFlow;
    if (processingNode.component.persistProcess == true && dataFlow.data != undefined) {
      persistFlow = JSON.parse(JSON.stringify(dataFlow.data));
    }
    //console.log('BEFORE createHistoriqueEnd');
    this.workspace_lib.createHistoriqueEnd(historic_object).then(historiqueEnd => {
      this.processNotifier.progress({
        componentId: historiqueEnd.componentId,
        processId: historiqueEnd.processId,
        error: historiqueEnd.error
      });
      if (processingNode.component.persistProcess == true) {
        //console.log('persistFlow',persistFlow);
        this.workspace_lib.addDataHistoriqueEnd(historiqueEnd._id, persistFlow).then(frag => {
          //console.log('ALLO',frag);
          this.processNotifier.persist({
            componentId: historiqueEnd.componentId,
            processId: historiqueEnd.processId,
            data: frag.data,
          })
        }).catch(e => {
          this.processNotifier.persist({
            componentId: historiqueEnd.componentId,
            processId: historiqueEnd.processId,
            error: 'error persisting historic data'
          })
        });
      }

    }).catch(e => {
      console.log(e);
      this.processNotifier.progress({
        componentId: processingNode.component._id,
        processId: this.processId,
        error: 'error writing historic'
      });
    });

    if (this.config.quietLog != true) {
      //console.log("CONSUPTION_HISTORIQUE", consumption_historic_object);
    }

    this.owner.credit -= historic_object.totalPrice;

    this.user_lib.update(this.owner);
  }


  // //TODO don't work if flow is array at fisrt depth
  // buildDfobFlow(currentFlow, dfobPathTab) {
  //   var currentDfob = dfobPathTab.shift();
  //   if (dfobPathTab.length > 0) {
  //     if (Array.isArray(currentFlow)) {
  //       var deepArray = currentFlow.map(currentInspectObject =>
  //         this.buildDfobFlow(
  //           currentInspectObject[currentDfob],
  //           dfobPathTab.slice(0)
  //         )
  //       );
  //       return [].concat.apply([], deepArray); // flatten array
  //     } else {
  //       return this.buildDfobFlow(
  //         currentFlow[currentDfob],
  //         dfobPathTab.slice(0)
  //       );
  //     }
  //   } else {
  //     var out = [];
  //     if (Array.isArray(currentFlow)) {
  //       out = out.concat(
  //         currentFlow.map(o => {
  //           return {
  //             objectToProcess: o,
  //             key: currentDfob
  //           };
  //         })
  //       );
  //     } else {
  //       out = out.concat({
  //         objectToProcess: currentFlow,
  //         key: currentDfob
  //       });
  //     }
  //     return out;
  //   }
  // }

  buildDfobFlowArray(currentFlow, dfobPathTab, key, keepArray) {
    //console.log('buildDfobFlowArray',currentFlow);
    if (Array.isArray(currentFlow)) {
      let flatOut = [];
      currentFlow.forEach((f, i) => {
        flatOut = flatOut.concat(this.buildDfobFlowArray(f, dfobPathTab, key, keepArray));
      })
      return flatOut;
    } else {

      return (this.buildDfobFlow(currentFlow, dfobPathTab, key, keepArray));
    }
  }
  buildDfobFlow(currentFlow, dfobPathTab, key, keepArray) {
    //console.log(dfobPathTab);
    if (dfobPathTab.length > 0) {
      //console.log('buildDfobFlow', dfobPathTab, keepArray);


      if (Array.isArray(currentFlow)) {
        let currentdFob = dfobPathTab[0];
        //console.log('buildDfobFlow processing ARRAY',currentFlow);
        let flatOut = [];
        currentFlow.forEach((f, i) => {
          flatOut = flatOut.concat(this.buildDfobFlowArray(f, dfobPathTab, currentdFob, keepArray));
        })
        return flatOut;
      } else {
        let newDfobPathTab = JSON.parse(JSON.stringify(dfobPathTab))
        let currentdFob = newDfobPathTab.shift();
        //console.log('buildDfobFlow processing OTHER',currentFlow);
        let flowOfKey = currentFlow[currentdFob];

        // TODO complex algorythm, To improve
        if (newDfobPathTab.length > 0) {
          return (this.buildDfobFlow(flowOfKey, newDfobPathTab, currentdFob, keepArray));
        } else {
          if (Array.isArray(flowOfKey) && keepArray != true) {
            return (this.buildDfobFlow(flowOfKey, newDfobPathTab, currentdFob, keepArray));
          } else {
            return (this.buildDfobFlow(currentFlow, newDfobPathTab, currentdFob, keepArray));
          }
        }
      }
    } else {
      //let flowOfKey = currentFlow[currentdFob];
      let out;
      if (Array.isArray(currentFlow) && keepArray != true) {
        //console.log('buildDfobFlow final ARRAY',keepArray,currentFlow);
        out = currentFlow.map((r, i) => {
          return {
            objectToProcess: currentFlow,
            key: i
          }
        })
      } else {
        //console.log('buildDfobFlow final OTHER',currentFlow)
        out = [{
          objectToProcess: currentFlow,
          key: key
        }]
      }
      // return {
      //   objectToProcess: currentFlow,
      //   key: key
      // }

      return out;
    }


    // var currentDfob = dfobPathTab.shift();
    // if (dfobPathTab.length > 0) {
    //   if (Array.isArray(currentFlow)) {
    //     var deepArray = currentFlow.map(currentInspectObject =>
    //       this.buildDfobFlow(
    //         currentInspectObject[currentDfob],
    //         dfobPathTab.slice(0)
    //       )
    //     );
    //     return [].concat.apply([], deepArray); // flatten array
    //   } else {
    //     return this.buildDfobFlow(
    //       currentFlow[currentDfob],
    //       dfobPathTab.slice(0)
    //     );
    //   }
    // } else {
    //   var out = [];
    //   if (Array.isArray(currentFlow)) {
    //     out = out.concat(
    //       currentFlow.map(o => {
    //         return {
    //           objectToProcess: o,
    //           key: currentDfob
    //         };
    //       })
    //     );
    //   } else {
    //     out = out.concat({
    //       objectToProcess: currentFlow,
    //       key: currentDfob
    //     });
    //   }
    //   return out;
    // }
  }



  buildPathResolution(workspace, component, requestDirection, depth, usableComponents, buildPath, queryParams, buildPathCauseLink) {
    //buildPath = buildPath || [];
    //infinite depth protection. Could be remove if process is safe
    if (depth < 100) {
      //var pathResolution = currentPathResolution || [];
      var incConsole = "";
      for (var i = 0; i < depth; i++) {
        incConsole += "-";
      }
      if (buildPath == undefined) {
        buildPath = {};
        buildPath.links = [];
        buildPath.nodes = [];
      }
      // console.log(" ---------- buildPathResolution -----------")
      // console.log(buildPath.links.map(link => {
      //   return (link.source._id+':'+link.source.name + ' -> ' + link.target._id+':'+link.target.name);
      // }));

      let module = this.technicalComponentDirectory[component.module];
      // console.log(incConsole, "buildPathResolution", component._id, requestDirection, module.type);

      if (module.buildQueryParam != undefined) {
        queryParams = {
          origin: component._id,
          queryParams: module.buildQueryParam(queryParams.queryParams, component.specificData)
        }
      }

      let existingNodesFilter = {
        "component._id": component._id
      };

      if (queryParams != undefined) {
        existingNodesFilter['queryParams.origin'] = queryParams.origin;
      } else {
        existingNodesFilter['queryParams'] = {
          $eq: undefined
        };
      }
      //console.log('existingNodesFilter', existingNodesFilter);
      var existingNodes = this.sift(existingNodesFilter,
        buildPath.nodes
      );

      let buildPathNode;
      if (existingNodes.length == 0) {
        buildPathNode = {
          component: component,
          queryParams: queryParams,
          status: 'waiting',
          targets: [],
          sources: []
        }
        buildPath.nodes.push(buildPathNode)
      } else {
        buildPathNode = existingNodes[0];
      }

      if (buildPathCauseLink != undefined)
        if (requestDirection == 'pull') {
          buildPathNode.targets.push(buildPathCauseLink);
          buildPathCauseLink.source = buildPathNode;
        } else if (requestDirection == 'push') {
        buildPathNode.sources.push(buildPathCauseLink);
        buildPathCauseLink.target = buildPathNode;
      }

      let connectionsBefore = this.sift({
        target: component._id
      }, workspace.links);

      let connectionsAfter = this.sift({
        source: component._id
      }, workspace.links);
      //console.log(connectionsBefore);
      //if (requestDirection == "pull") {
      if (requestDirection != "push") {
        if (
          connectionsBefore.length > 0 &&
          !(requestDirection == "pull" && module.stepNode == true)
        ) {
          for (var beforelink of connectionsBefore) {
            //console.log(beforeComponent);
            var beforeComponentObject = this.sift({
                _id: beforelink.source
              },
              usableComponents
            )[0];
            //console.log("beforeComponentObject",beforeComponentObject);
            //protection against dead link
            if (beforeComponentObject) {

              let existingLinkFilter = {
                "linkId": beforelink._id
              }
              if (queryParams != undefined) {
                existingLinkFilter["queryParams.origin"] = queryParams.origin;
              } else {
                existingLinkFilter["queryParams"] = {
                  $eq: undefined
                };
              }
              var existingLink = this.sift(existingLinkFilter,
                buildPath.links
              );
              if (existingLink.length == 0) {
                var linkToProcess = {
                  //sourceComponentId: beforeComponentObject._id,
                  target: buildPathNode,
                  requestDirection: "pull",
                  queryParams: queryParams,
                  linkId: beforelink._id
                };
                //linkToProcess.status='waiting';
                buildPath.links.push(linkToProcess);
                buildPathNode.sources.push(linkToProcess)
                //console.log(linkToProcess);
                //buildPath.push(out);
                this.buildPathResolution(
                  workspace,
                  beforeComponentObject,
                  "pull",
                  depth + 1,
                  usableComponents,
                  buildPath,
                  queryParams,
                  linkToProcess
                )
              }
            }
          }
        }
      }
      if (requestDirection != "pull") {
        if (
          connectionsAfter.length > 0 &&
          !(requestDirection == "push" && module.stepNode == true)
        ) {
          for (var afterlink of connectionsAfter) {
            //console.log(beforeComponent);
            var afterComponentObject = this.sift({
                _id: afterlink.target
              },
              usableComponents
            )[0];
            //console.log("beforeComponentObject",beforeComponentObject);
            //protection against dead link
            if (afterComponentObject) {

              let existingLinkFilter = {
                "linkId": afterlink._id
              }
              if (queryParams != undefined) {
                existingLinkFilter["queryParams.origin"] = queryParams.origin;
              } else {
                existingLinkFilter["queryParams"] = {
                  $eq: undefined
                };
              }
              var existingLink = this.sift(existingLinkFilter,
                buildPath.links
              );
              if (existingLink.length == 0) {
                var linkToProcess = {
                  //sourceComponentId: beforeComponentObject._id,
                  source: buildPathNode,
                  requestDirection: "push",
                  queryParams: queryParams,
                  linkId: afterlink._id
                };
                //linkToProcess.status='waiting';
                buildPath.links.push(linkToProcess);
                buildPathNode.targets.push(linkToProcess)
                //console.log(linkToProcess);
                //buildPath.push(out);
                this.buildPathResolution(
                  workspace,
                  afterComponentObject,
                  "push",
                  depth + 1,
                  usableComponents,
                  buildPath,
                  queryParams,
                  linkToProcess
                )
              }
            }
          }
        }
      }

      return buildPath;
    }

  }

}

module.exports = {
  // threads: require("threads"),
  execute: function(component, requestDirection, stompClient, callerId, pushData, queryParams) {
    let engine = new Engine(component, requestDirection, stompClient, callerId, pushData, queryParams);
    return engine.resolveComponent();
  }
  // getNewInstance: function() {
  //   let out = new Engine();
  //   return out;
  // },
  // executeInThread: function(component, requestDirection, pushData) {
  //   const thread = this.threads.spawn(function([
  //     dirname,
  //     component,
  //     requestDirection,
  //     pushData
  //   ]) {
  //     return new Promise((resolve, reject) => {
  //       let recursivPullResolvePromise = require(dirname +
  //         "/recursivPullResolvePromise.js");
  //       recursivPullResolvePromise
  //         .getNewInstance()
  //         .resolveComponent(component, requestDirection, pushData)
  //         .then(data => {
  //           resolve(data);
  //         })
  //         .catch(err => {
  //           reject(err);
  //         });
  //     });
  //   });
  //
  //   return new Promise((resolve, reject) => {
  //     thread
  //       .send([__dirname, component, requestDirection, pushData])
  //       // The handlers come here: (none of them is mandatory)
  //       .on("message", function(response) {
  //         thread.kill();
  //         resolve(response);
  //       })
  //       .on("error", function(error) {
  //         reject(error);
  //       });
  //   });
  // }
};
