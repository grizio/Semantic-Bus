function WorkspaceStore() {


  // --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------


  riot.observable(this)
  this.workspaceCollection = [];
  this.workspaceShareCollection = []
  this.workspaceCurrent;
  this.workspaceBusiness = new WorkspaceBusiness();
  this.cancelRequire = false;


  // --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------
  // --------------------------------------------------------------------------------


  // ----------------------------------------- FUNCTION  -----------------------------------------


  this.load = function(callback) {
    console.log('load workspace to ||', localStorage.user_id);
    $.ajax({
      method: 'get',
      url: '../data/core/workspaceByUser/' + localStorage.user_id,
      headers: {
        "Authorization": "JTW" + " " + localStorage.token
      },
      contentType: 'application/json',
    }).done(function(data) {
      console.log('load workspace', data);
      this.workspaceCollection = data;
      if (callback != undefined) {
        callback();
      }
      this.trigger('workspace_collection_changed', this.workspaceCollection);
      // if (this.workspaceCurrent) {
      //   console.log("Update current workspace")
      //   this.updateComponentListe(this.workspaceCurrent)
      // }
    }.bind(this));
  }; //<= load_workspace

  // --------------------------------------------------------------------------------

  this.loadShareWorkspace = function(callback) {
    console.log('load share workspace');
    $.ajax({
      method: 'get',
      url: '../data/core/workspaces/share/' + localStorage.user_id,
      headers: {
        "Authorization": "JTW" + " " + localStorage.token
      },
      contentType: 'application/json',
    }).done(function(data) {
      console.log('ShareWorkspace load', data);
      this.workspaceShareCollection = data;
      if (callback != undefined) {
        callback();
      }
      this.trigger('workspace_share_collection_changed', this.workspaceShareCollection);
    }.bind(this));
  }; //<= load_share_workspace

  // --------------------------------------------------------------------------------

  this.create = function() {
    console.log('create');
    this.trigger('persist_start');
    $.ajax({
      method: 'post',
      url: '../data/core/workspace/' + localStorage.user_id,
      data: JSON.stringify(this.workspaceCurrent),
      contentType: 'application/json',
      headers: {
        "Authorization": "JTW" + " " + localStorage.token
      },
    }).done(function(data) {
      this.trigger('persist_end',data);
      //data.mode = 'init';
      //his.menu='information'
      this.workspaceBusiness.connectWorkspaceComponent(data.components);
      this.workspaceCurrent = data;
      //console.log('update data ||', data);
      this.trigger('workspace_current_persist_done', data);
      this.trigger('workspace_current_changed', this.workspaceCurrent);
    }.bind(this));
  }; //<= create

  // --------------------------------------------------------------------------------

  this.update = function(data) {
    return new Promise((resolve,reject)=>{
      var ajax_data = JSON.stringify(this.workspaceBusiness.serialiseWorkspace(this.workspaceCurrent))
      this.trigger('persist_start');
      $.ajax({
        method: 'put',
        url: '../data/core/workspace',
        data: ajax_data,
        contentType: 'application/json',
        headers: {
          "Authorization": "JTW" + " " + localStorage.token
        },
      }).done(function(data) {
        this.trigger('persist_end',data);
        data.mode = 'edit';
        this.workspaceBusiness.connectWorkspaceComponent(data.components);
        this.workspaceCurrent = data;
        //console.log('update data ||', data);
        this.trigger('workspace_current_persist_done', data);
        this.trigger('workspace_current_changed', this.workspaceCurrent);
        resolve(data);
      }.bind(this));
    })


  }; //<= update

  // --------------------------------------------------------------------------------

  this.delete = function(record) {
    console.log('delete row', record);
    $.ajax({
      method: 'delete',
      url: '../data/core/workspace/' + record._id + '/' + localStorage.user_id,
      contentType: 'application/json',
      headers: {
        "Authorization": "JTW" + " " + localStorage.token
      },
    }).done(function(data) {
      this.load(function() {
        this.trigger('workspace_collection_changed', this.workspaceCollection);
      }.bind(this));
    }.bind(this));
  }; //<= delete

  // --------------------------------------------------------------------------------

  this.updateUserListe = function(data) {
    console.log('updateUserListe', data);
    $.ajax({
      method: 'get',
      url: '../data/core/workspaces/' + data._id + '/user/' + localStorage.user_id,
      headers: {
        "Authorization": "JTW" + " " + localStorage.token
      },
      contentType: 'application/json'
    }).done(function(data) {
      console.log('updateUserListeDone', data);
      if (data != false) {
        this.trigger('all_profil_by_workspace_loaded', data)
      } else {
        this.trigger('no_profil')
      }

    }.bind(this));
  }; // <= updateUserListe


  // --------------------------------------------------------------------------------


  // this.updateComponentListe = function(data) {
  //   console.log('update Component Liste', data);
  //   $.ajax({
  //     method: 'get',
  //     url: '../data/core/workspace/' + data._id,
  //     headers: {
  //       "Authorization": "JTW" + " " + localStorage.token
  //     },
  //     contentType: 'application/json'
  //   }).done(function(data) {
  //     console.log("update Component Liste Done ||", data)
  //     if (data != false) {
  //       if (this.workspaceCurrent) {
  //         this.workspaceCurrent = data
  //         this.workspaceCurrent.mode = "edit"
  //         this.trigger('all_component_by_workspace_loaded', data)
  //         this.trigger('workspace_current_changed', data);
  //       }
  //     }
  //   }.bind(this));
  // }; // <= updateComponentList


  // --------------------------------------------------------------------------------

  this.select = function(record) {
    return new Promise((resolve, reject) => {
      console.log('select ||', record);
      this.workspaceCurrent = record;
      $.ajax({
        method: 'get',
        url: '../data/core/workspace/' + record._id,
        headers: {
          "Authorization": "JTW" + " " + localStorage.token
        },
        contentType: 'application/json'
      }).done(data => {
        this.workspaceBusiness.connectWorkspaceComponent(data.components);
        this.workspaceCurrent = data;
        this.workspaceCurrent.mode = 'edit';
        this.menu='component'
        //this.workspaceCurrent.synchronized =true;
        resolve(data);
      });
    });

  }; // <= select

  // ----------------------------------------- EVENT  -----------------------------------------

  this.on('workspace_delete', function(record) {
    console.log('ON workspace_delete ||', record);
    this.delete(record);
  }); // <= workspace_delete

  // --------------------------------------------------------------------------------

  this.on('workspace_collection_load', function(record) {
    console.log('ON workspace_collection_load ||', record);
    if (this.cancelRequire == false) {
      this.load()
    } else {
      this.cancelRequire = false;
      this.select(this.workspaceCurrent);
    }
  }); // <= workspace_collection_load

  // --------------------------------------------------------------------------------

  this.on('workspace_collection_share_load', function(record) {
    console.log('ON workspace_collection_share_load ||', record);
    if (this.cancelRequire == false) {
      this.loadShareWorkspace(function() {
        // for (workspace of this.workspaceShareCollection) {
        //   workspace.components = this.workspaceBusiness.connectWorkspaceComponent(workspace.components);
        //   console.log()
        // }
        this.trigger('workspace_share_collection_changed', this.workspaceShareCollection);
      }.bind(this));
    } else {
      this.cancelRequire = false;
      this.select(this.workspaceCurrent);
    }
  }); // <= workspace_collection_share_load


  // --------------------------------------------------------------------------------


  // this.on('workspace_synchoniseFromServer_byId', function(id) {
  //   console.log('workspace_synchoniseFromServer_workspace_byId', id);
  //   $.ajax({
  //     method: 'get',
  //     url: '../data/core/workspace/' + id,
  //     headers: {
  //       "Authorization": "JTW" + " " + localStorage.token
  //     }
  //   }).done(function(data) {
  //     var synchronizedWorkspaceCollection = [];
  //     for (var workspace of this.workspaceCollection) {
  //       if (workspace._id == data._id) {
  //         // data.components = this.workspaceBusiness.connectWorkspaceComponent(data.components);
  //         synchronizedWorkspaceCollection.push(data);
  //         console.log('workspace_synchoniseFromServer_workspace_byId | workspaceCurrent | ', this.workspaceCurrent);
  //         console.log('workspace_synchoniseFromServer_workspace_byId | New workspaceCurrent | ', data);
  //         this.workspaceCurrent = data;
  //       } else {
  //         synchronizedWorkspaceCollection.push(workspace);
  //       }
  //     }
  //     this.workspaceCollection = synchronizedWorkspaceCollection;
  //     this.trigger('workspace_synchoniseFromServer_done', this.workspaceCollection);
  //     this.trigger('workspace_collection_changed', this.workspaceCollection);
  //   }.bind(this));
  // }); // <= workspace_synchoniseFromServer_byId

  // --------------------------------------------------------------------------------

  this.on('workspace_current_updateField', function(message) {
    console.log('workspace_current_updateField ||', message)
    this.workspaceCurrent[message.field] = message.data;
    this.workspaceCurrent.synchronized = false;
    this.trigger('workspace_current_changed', this.workspaceCurrent);
  }); // <= workspace_current_updateField

  // --------------------------------------------------------------------------------

  this.on('workspace_current_select', function(record) {

    this.select(record).then(workspace => {
      console.log('workspace_current_select ||', record)
      this.trigger('workspace_current_select_done', workspace);
      //this.trigger('workspace_current_changed', workspace);
    })
  }); // <= workspace_current_select

  // --------------------------------------------------------------------------------

  this.on('workspace_current_cancel', function(record) {
    console.log('workspace_current_cancel ||', this.workspaceCurrent)
    this.workspaceCurrent.mode = 'read'
    this.select(this.workspaceCurrent);
  }); // <= workspace_current_cancel

  // --------------------------------------------------------------------------------

  this.on('workspace_current_edit', function(data) {
    this.workspaceCurrent.mode = 'edit';
    this.trigger('workspace_current_changed', this.workspaceCurrent);

  }); // <= workspace_current_edit

  // --------------------------------------------------------------------------------

  this.on('workspace_current_init', function() {
    console.log('model : workspace_current_init');
    this.workspaceCurrent = {
      name: "",
      description: "",
      components: [],
      users: []
    };
    this.workspaceCurrent.mode = 'init';
    this.menu='information';
    this.trigger('workspace_current_select_done', this.workspaceCurrent);
    //this.trigger('workspace_editor_menu_changed', this.menu);
    //this.trigger('workspace_current_changed', this.workspaceCurrent);
  }); // <= workspace_current_init

  // --------------------------------------------------------------------------------


  this.on('workspace_current_refresh', function () {
    console.log('workspace_current_refresh || ', this.workspaceCurrent,this.menu);
    this.trigger('workspace_editor_menu_changed', this.menu);
    this.trigger('workspace_current_changed', this.workspaceCurrent);
  }); // <= workspace_current_refresh

  // --------------------------------------------------------------------------------


  this.on('workspace_current_persist', function() {
    console.log('workspace_current_persist',this.workspaceCurrent);
    var mode = this.workspaceCurrent.mode;
    if (mode == 'init') {
      this.create();
    } else if (mode == 'edit') {
      this.update(this.workspaceCurrent).then(data=>{
        //nothing to do. specific action in other case
      })
    }
  }); // <= workspace_current_persist

  // --------------------------------------------------------------------------------

  // this.on('workspace_current_add_component', function(data) {
  //   console.log("workspace_current_add_component ||", data)
  //   data.workspaceId = this.workspaceCurrent._id;
  //   data.specificData = {};
  //   this.workspaceCurrent.components.push(data);
  //   // this.trigger('save_auto', {
  //   //   compoenent:data,
  //   //   workspace: this.workspaceCurrent,
  //   // })
  //   this.trigger('save_auto')
  // });

  this.on('workspace_current_add_components', function(data) {
    console.log("workspace_current_add_components ||", data);
    data.forEach(c=>{
      c.workspaceId = this.workspaceCurrent._id;
      c.specificData = {};
      this.workspaceCurrent.components.push(c);
    })
    this.update(this.workspaceCurrent).then(data=>{
      this.trigger('workspace_current_add_components_done');
    })
  });

  // --------------------------------------------------------------------------------

  this.on('workspace_current_delete_component', function(record) {
    console.log("workspace_current_delete_component ||", record)
    this.workspaceCurrent.components.splice(this.workspaceCurrent.components.indexOf(record), 1);
    console.log('workspace_current_delete_component_before_update',this.workspaceCurrent);
    this.update(this.workspaceCurrent);
    //this.trigger('workspace_current_changed', this.workspaceCurrent);

  }); //<= workspace_current_delete_component

  // --------------------------------------------------------------------------------


  // this.on('item_current_cancel', function(data) {
  //   console.log('item_current_cancel ||', data);
  //   this.workspaceCurrent.mode = 'read';
  //   this.cancelRequire = true;
  // }); //<= item_current_cancel

  // --------------------------------------------------------------------------------


  this.on('own_all_workspace', function(data) {
    $.ajax({
      method: 'get',
      url: '../data/core/workspaceOwnAll/' + localStorage.user_id,
      headers: {
        "Authorization": "JTW" + " " + localStorage.token
      },
      contentType: 'application/json',
    }).done(function(data) {
      this.workspaceCollection = data;
      this.trigger('workspace_collection_changed', this.workspaceCollection);
    }.bind(this));
  }); //<= own_all_workspace

  // --------------------------------------------------------------------------------

  // this.on('workspace_current_graph', function(data) {
  //   this.trigger('workspace_current_graph_changed', this.workspaceCurrent);
  //   // $.ajax({
  //   //   method: 'get',
  //   //   url: '../data/core/workspaceComponent/load_all_component/' + this.workspaceCurrent._id,
  //   //   headers: {
  //   //     "Authorization": "JTW" + " " + localStorage.token
  //   //   },
  //   //   contentType: 'application/json',
  //   // }).done(function (data) {
  //   //   this.workspaceCurrent = data
  //   //   console.log("CURRENT GRAPH TRIGGER", this.workspaceCurrent)
  //   //   this.trigger('workspace_current_graph_changed', this.workspaceCurrent);
  //   // }.bind(this));
  // }); //<= own_all_workspace

  ///GESTION DES DROIT DE USER

  this.on('share-workspace', function(data) {
    console.log('share-workspace |',data,localStorage.token);
    $.ajax({
      method: 'put',
      url: '../data/core/share/workspace/',
      data: JSON.stringify(data),
      headers: {
        "Authorization": "JTW" + " " + localStorage.token
      },
      // beforeSend: function() {
      //   this.trigger('share_change_send');
      // }.bind(this),
      contentType: 'application/json'
    }).done(function(data) {
      console.log('in share data', data)
      if (data == false) {
        this.trigger('share_change_no_valide')
      } else if (data == "already") {
        this.trigger('share_change_already')
      } else {
        this.userCurrrent = data,
        console.log('share-workspace',data);
        this.trigger('share_change', {
          user: data.user,
          workspace: data.workspace
        })
      }
    }.bind(this));
  });

  this.on('connect_components', function(source, destination) {
    source.connectionsAfter.push(destination);
    destination.connectionsBefore.push(source);
    this.update(this.workspaceCurrent);
  });

  this.on('disconnect_components', function(source, destination) {
    source.connectionsAfter.splice(source.connectionsAfter.indexOf(destination), 1);
    destination.connectionsBefore.splice(destination.connectionsBefore.indexOf(source), 1);
    this.update(this.workspaceCurrent);
  });

  //it is here because genericStore manage the current item and drad&drop impact others
  this.on('item_updateField', function(message) {
    console.log('item_current_updateField ', message);
    let item= sift({_id:message.id},this.workspaceCurrent.components)[0];
    item[message.field] = message.data;
    this.trigger('workspace_current_changed', this.workspaceCurrent);
  }); //<= item_current_updateField

  this.on('workspace_editor_change_menu', function(menu) {
    this.menu=menu;
    this.trigger('workspace_editor_menu_changed', this.menu);
  });


}
