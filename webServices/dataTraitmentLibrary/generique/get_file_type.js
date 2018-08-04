var exel = require('../exel/exel_traitment.js');
var rdf = require('../rdf/rdf_traitment.js');
var xml = require('../xml/xml_traitment.js');
var csv = require('../csv/csv_traitment.js');

module.exports = {
  type_file: _type_file,
};




function _extension(filename, contentType) {
  console.log("contentType", contentType, "filename", filename)
  return new Promise(function(resolve, reject) {

    if (filename != null) {
      //console.log(filename.match(reg)[0])
      //let matchArray=filename.match(reg);
      //console.log(filename.match(reg));
      var regex = /\.(.+)/g;
      var reg = new RegExp(regex, 'g');
      let regResult = reg.exec(filename)
      resolve(regResult.pop())
    } else {
      if (contentType) {
        //console.log(contentType)
        //resolve(contentType)
        var regex = /\/(.+)/g;
        var reg = new RegExp(regex, 'g');
        let regResult = reg.exec(contentType)
        resolve(regResult.pop())
      } else {
        reject()
      }
    }
  })
}

function _type_file(filename, dataString, dataBuffer, out, contentType) {
  //console.log("in aggregate function")
  return _extension(filename, contentType).then(function(extension) {
    console.log("extension |", extension)
    return new Promise(function(resolve, reject) {
      if (out == true || out == 'true') {
        //console.log(out)
        resolve({
          data: exel.json_to_exel(dataString.data)
        })
      } else {

        switch (extension) {
          // JSONLD ///JSON //DONE
          case ("json"):
          case ("json-ld"):
            //console.log()
            resolve({
              data: JSON.parse(dataString)
            })
            break;

            // RDF TTL DONE
          case ("ttl"):
            rdf.rdf_traitmentTTL(dataString).then(function(reusltat) {
              //console.log(reusltat)
              resolve({
                data: reusltat
              })
            }, function(err) {
              reject("votre fichier n'est pas au norme ou pas du bon format, n'hesitez pas a verifier que votre source d'entrée est bien un buffer")
            })
            break;

            // RDF XML DONE IF TEST PARSE
          case ("rdf"):
          case ("owl"):
            //console.log('allo');
            rdf.rdf_traitmentXML(dataString).then(result => {
              // console.log("RDF", reusltat)
              //console.log(JSON.stringify(reusltat))
              resolve({
                data: result
              })
            }, function(err) {
              reject("votre fichier n'est pas au norme ou pas du bon format, n'hesitez pas a verifier que votre source d'entrée est bien un buffer")
            })
            break;

            // EXEL/CSV/XLSX DONE
          case ("xls"):
          case ("xlsx"):
          case ("ods"):
            exel.exel_traitment_client(dataBuffer).then(function(resultat) {
              //console.log("RESULTAT", resultat)
              exel.exel_traitment_server(resultat, true).then(function(exelTraite) {
                //console.log("FINAL", exelTraite)
                resolve({
                  data: exelTraite
                })
              })
            }, function(err) {
              reject("votre fichier n'est pas au norme ou pas du bon format, n'hesitez pas a verifier que votre source d'entrée est bien un buffer")
            })
            break;

            // XML DONE
          case ("xml"):
            xml.xml_traitment(dataString).then(function(reusltat) {
              // //console.log("FINAL", reusltat)
              //console.log("FINAL", reusltat)
              resolve({
                data: reusltat
              })
            }, function(err) {
              reject("votre fichier n'est pas au norme ou pas du bon format, n'hesitez pas a verifier que votre source d'entrée est bien un buffer")
            })
            break;
          case ("csv"):
            csv.csvtojson(dataString).then((result)=>{
              // //console.log("FINAL", reusltat)
              //console.log("FINAL", reusltat)
              resolve({
                data: result
              })
            }, function(err) {
              console.log('err',err);
              reject("votre fichier n'est pas au norme ou pas du bon format, n'hesitez pas a verifier que votre source d'entrée est bien un buffer")
            })
            break;
          default:
            //console.log("in default")
            reject("erreur, votre fichier n'est pas au bon format")

            break;
        }
      }
    })
  })
}
