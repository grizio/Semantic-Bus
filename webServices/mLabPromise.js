'use strict';

const https = require('https');
var mlab_token = require('../configuration').mlab_token

//const url = require('url');
//doc to promises : http://stackoverflow.com/questions/35182752/promises-with-http-get-node-js


module.exports = {
  configuration: require('../configuration'),
  request(method, resource, dataToSend, options, databaseName) {
    return this._makeRequest(method, resource, dataToSend, options, databaseName);
  },

  _makeRequest(method, resource, dataToSend, options, databaseName) {

    // create a new Promise
    return new Promise((resolve, reject) => {

      /* Node's URL library allows us to create a
       * URL object from our request string, so we can build
       * our request for http.get */
      //const parsedUrl = url.parse(urlString);
      const requestOptions = this._createMLabOptions(method, resource, options, databaseName);
      //console.log('path :',requestOptions.path);
      //console.log('REQUEST :',requestOptions,dataToSend);
      const request = https.request(requestOptions, res => this._onResponse(res, resolve, reject));

      /* if there's an error, then reject the Promise
       * (can be handled with Promise.prototype.catch) */
      request.on('error', function(e) {
         console.log('error',e);
        reject(e)
      });
      //request.on('error', function(e){resolve({info:'mlab fail',error:e})});
      request.end(JSON.stringify(dataToSend));
    });
  },

  // the options that are required by http.get
  _createMLabOptions(methodREST, resource, options, databaseName) {
    var params = "";
    // console.log(options);
    for (var paramKey in options) {
      params += paramKey + '=';
      params += JSON.stringify(options[paramKey]);
      params += '&'
    }
    // console.log(params);
    //console.log('PORT | ',process.env.NODE_PORT);
    if (databaseName == undefined) {
      databaseName = this.configuration.DB;
    }

    return {
      hostname: 'api.mlab.com',
      path: '/api/1/databases/' + databaseName + '/collections/' + resource + '/?' + params + 'apiKey=' + mlab_token,
      /*port: url.port,*/
      method: methodREST,
      headers: {
        'Content-Type': 'application/json'
      }
    };
  },

  /* once http.get returns a response, build it and
   * resolve or reject the Promise */
  _onResponse(response, resolve, reject) {
    //console.log('RESPONSE');
    const hasResponseFailed = response.status >= 400;
    var responseBody = '';

    if (hasResponseFailed) {
      console.log('FAIL');
      reject(`Request to ${response.url} failed with HTTP ${response.status}`);
    }

    /* the response stream's (an instance of Stream) current data. See:
     * https://nodejs.org/api/stream.html#stream_event_data */
    response.on('data', chunk => responseBody += chunk.toString());



    // once all the data has been read, resolve the Promise
    //maybe JSON.parse(responseBody)
    response.on('end', () => {
      resolve(JSON.parse(responseBody))
    });
  },

  cloneDatabase() {
    console.log('configuration :',this.configuration);
    return new Promise((resolve, reject) => {
      console.log('clone start');
      var workspaceComponentToDeletePromise = this.request('GET', 'workspacecomponents');
      var workspaceComponentToInsertPromise = this.request('GET', 'workspacecomponents', undefined, undefined, this.configuration.DBToClone);
      var workspaceToDeletePromise = this.request('GET', 'workspaces');
      var workspaceToInsertPromise = this.request('GET', 'workspaces', undefined, undefined, this.configuration.DBToClone);
      //ne pas cloner les user mais approprier les workspaces au user connecté
      // var userToDeletePromise = this.request('GET', 'users');
      // var userToInsertPromise = this.request('GET', 'users', undefined, undefined, this.configuration.DBToClone);

      var readPromises = Promise.all([workspaceComponentToDeletePromise, workspaceComponentToInsertPromise, workspaceToDeletePromise, workspaceToInsertPromise]);

      //var workspaceComponentPromises = Promise.all([workspaceComponentToDeletePromise,workspaceComponentToInsertPromise]);
      var insertWorkspaceData;
      var insertComponentData;

      readPromises.then(data => {

        //console.log(data[0]);
        let PromisesExecution = [];
        console.log('remove ',data[0].length,' workspaceComponents');
        for (var record of data[0]) {
          PromisesExecution.push(this.request('DELETE', 'workspacecomponents/' + record._id.$oid))
        }

        insertWorkspaceData=data[1];

        console.log('remove ',data[2].length,' workspaces');
        for (var record of data[2]) {
          PromisesExecution.push(this.request('DELETE', 'workspaces/' + record._id.$oid))
        }
        insertComponentData=data[3];

        // for (var record of data[4]) {
        //   PromisesExecution.push(this.request('DELETE', 'users/' + record._id.$oid))
        // }
        // for (var record of data[5]) {
        //   PromisesExecution.push(this.request('POST', 'users', record))
        // }

        return Promise.all(PromisesExecution);
      }).then(data => {

        console.log(data);
        let PromisesExecution = [];
        console.log('add ',insertWorkspaceData.length,' workspaceComponents');
        for (var record of insertWorkspaceData) {
          PromisesExecution.push(this.request('POST', 'workspacecomponents', record))
        }
        console.log('add ',insertComponentData.length,' workspaces');
        for (var record of insertComponentData) {
          PromisesExecution.push(this.request('POST', 'workspaces', record))
        }
        // for (var record of data[4]) {
        //   PromisesExecution.push(this.request('DELETE', 'users/' + record._id.$oid))
        // }
        // for (var record of data[5]) {
        //   PromisesExecution.push(this.request('POST', 'users', record))
        // }

        return Promise.all(PromisesExecution);
      }).then(data => {
        console.log('CLONE DONE');
        resolve({
          status: 'done'
        });
      });

    });

  }


};
