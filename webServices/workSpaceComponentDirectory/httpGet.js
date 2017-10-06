module.exports = {
  type: 'REST Get HTPP',
  description: 'intéroger une API REST avec une requete Get qui fourni un flux',
  editor: 'rest-get-editor',
  graphIcon:'restGetHttp.png',
  url: require('url'),
  http: require('http'),
  https: require('follow-redirects').https,
  dataTraitment: require("../dataTraitmentLibrary/index.js"),
  makeRequest: function (methodRest, urlString, contentType) {
    var _self = this
    console.log(contentType)
    //Probleme de contexte avec les arrow function
    return new Promise((resolve, reject) => {
      const parsedUrl = this.url.parse(urlString);
      const requestOptions = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.path,
        port: parsedUrl.port,
        method: 'get',
        headers: {
          Accept: 'text/plain, application/xml , application/ld+json',
          'user-agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:44.0) Gecko/20100101 Firefox/44.0',
        }
      };


      var lib = urlString.indexOf('https') != -1 ? this.https : this.http;
      const request = lib.request(requestOptions, response => {
        const hasResponseFailed = response.statusCode >= 400;
        // console.log('REST Get  | header |', response.headers['content-disposition']);
        var responseBody = '';
        var responseBodyExel = [];
        if (hasResponseFailed) {
          reject(`Request to ${response.url} failed with HTTP ${response.status}`);
        }

        response.on('data', chunk => {
          responseBody += chunk.toString();
          responseBodyExel.push(chunk);
        });

        response.on('end', function () {
          // console.log("RESPONSE BEFORE TRAITMENT", responseBody)
          _self.dataTraitment.type.type_file(response.headers['content-disposition'],responseBody, responseBodyExel, undefined,  contentType).then(function(result){
            // console.log(result)
            resolve(result)
          })
          console.log('end');
        }.bind(this));
      });

      request.on('error', function (e) {
        console.log('error :', e);
        reject();
      });
      request.end();
    });
  },
  pull: function (data) {
    console.log('REST Get JSON | pull : ',data);
    return this.makeRequest('GET', data.specificData.url, data.specificData.contentType);
  }
};
