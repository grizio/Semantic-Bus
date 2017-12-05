module.exports = {
  type: 'Flow Agregator',
  description: 'agréger plusieurs flux pour n en former qu un',
  editor: 'simple-agregator-editor',
  graphIcon:'flowAggregator.png',
  sift: require('sift'),
  transform: require('jsonpath-object-transform'),
  tags:[
    'http://semantic-bus.org/data/tags/middleComponents',
    'http://semantic-bus.org/data/tags/middleComponentsAgregation'
  ],


  pull: function(data, flowData) {
    //console.log('Flow Agregator | pull : ',data,' | ',flowData);
    return new Promise((resolve, reject) => {
      var resultFlow = [];
      //console.log(data);
      for (flow of flowData) {
        for (record of flow.data) {
          var filter = {};
          var everExistingData = [];
          if (data.specificData.unicityFields != undefined && data.specificData.unicityFields.length>0) {
            for (unicityField of data.specificData.unicityFields) {
              let transformer={value:'$.'+unicityField.field};
              let findedValue = this.transform(record, transformer);
              //console.log(findedValue);
              //console.log(unicityField.field,record);
              if (findedValue.value != undefined) {
                filter[unicityField.field] = findedValue.value;
              }
            }
            //console.log(filter);
            if(Object.keys(filter).length !== 0){
              everExistingData = this.sift(filter, resultFlow);
            }
          }

          //console.log(filter,everExistingData);
          //console.log(everExistingData);
          if (everExistingData.length > 0) {
            //console.log('unicite |', everExistingData);
            var oldRecord = everExistingData[0];
            //console.log(resultFlow.indexOf(everExistingData[0]));
            for (key in record) {
              if (oldRecord[key] == undefined) {
                oldRecord[key] = record[key];
              }
            }
            resultFlow[resultFlow.indexOf(everExistingData[0])] = oldRecord;
          } else {
            resultFlow.push(record);
          }
        }


        //console.log('Flow Agregator | result flow |  ',flow);
        //resultFlow = resultFlow.concat(flow.data)
      }
      //console.log('Flow Agregator | result total |  ',resultFlow);
      resolve({
        data: resultFlow
      });
    })
  }
}
