
angularAPP.factory('NewConnectorFactory', function (supportedConnectorsFactory, $log, $rootScope, env, $filter) {


  /* Public API */
  return {

    initConnector : function (name) {
        var con = supportedConnectorsFactory.getSupportedConnector().filter(supportedConnectorsFactory.matchesName(name))[0];
        if (con != undefined) {
          return angular.copy(con);
        } else
        return undefined
    },

    flattenConnectorKeyValues: function (connector) {
       //3 nested lists: Steps -> Sections -> Elements
          var sectionsPerStep = connector.template.map(function (step) {
              var sections = step.sections.map(function (section) {
                  return section.elements.map(function (element) {
                      return element.key + '=' + element.value;// + '\n';
                  })
               });
               return [].concat.apply([], sections); //All sections flatten
           });
          return [].concat.apply([], sectionsPerStep); //All steps flatten;
    },

    //TODO how it returns??
    updateConnectorFromModelValues: function(flattenValues, connector) {
       angular.forEach(flattenValues, function(item) {
          var keyValue = item.split('=');
          var sectionsPerStep = connector.template.map(function (step) {
               return step.sections.map(function (section) {
                   return section.elements.map(function (element) {
                        if(keyValue[0] == element.key) {
                          if(parseInt(keyValue[1])) element.value = parseInt(keyValue[1]);
                          else element.value=keyValue[1];
                        }
                  })
               });
           });
       });
    },

    getCurlCommand: function (configValues) {
          var connectorCurlObject = makeConfigFromConfigValuesArray(configValues);
          delete connectorCurlObject.config.name;
          return prepareCurlCommandString(connectorCurlObject);
    },

    getJSONConfig: function (configValues) {
          var connectorCurlObject = makeConfigFromConfigValuesArray(configValues);
          delete connectorCurlObject.config.name;
          return connectorCurlObject;
    },

    getJSONConfigFlat : function (configValues) {
          return makeConfigFromConfigValuesArray(configValues).config;
    },

    //Not in use
    emptyValues: function(connector) {
       var steps = connector.template.map(function (step) {
             return step.sections.map(function (section) {
               section.elements.map(function (element) {
                    element.value = '';
                    return element;
                });
                return section;
             });
         });
         connector.template = steps;
         return connector;
    }

  };

  /* Private Methods */

  function prepareCurlCommandString(curlCommandObj) {
      var prefix = "cat << EOF > " + curlCommandObj.name + ".json" + "\n";
      var content = angular.toJson(curlCommandObj, true);
      var suffix = "\n" + "EOF" +
                   "\n" + 'curl -X POST -H "Content-Type: application/json" -H "Accept: application/json" -d @' +
                   curlCommandObj.name + '.json ' +
                   env.KAFKA_CONNECT() + '/connectors';
      return prefix + content + suffix;
  }

  /**
   *  This function includes `name` in the config object. TODO Do we need it?
   **/
  function makeConfigFromConfigValuesArray(configValues) {
      var connectorCurlObject = {
           name: "",
           config: {}
      };

       angular.forEach(configValues, function (propertyLine) {
         if (propertyLine.length > 2) {
           var key = propertyLine.substring(0, propertyLine.indexOf('='));
           var value = propertyLine.substring(propertyLine.indexOf('=') + 1);
           connectorCurlObject.config["" + key] = value;
         }
       });

       connectorCurlObject.name = connectorCurlObject.config.name;
       return connectorCurlObject;
  }

});