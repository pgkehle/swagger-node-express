'use strict';

var _ = require('lodash');

module.exports.wrap = wrap;
module.exports.appendToApi = appendToApi;

function wrap(callback, req, resp) {
  callback(req, resp);
}

// appends a spec to an existing operation

function appendToApi(rootResource, api, spec) {
  var validationErrors = [];

  if (!spec.nickname || spec.nickname.indexOf(' ') >= 0) {
    //  nicknames don't allow spaces
    validationErrors.push({
      'path': api.path,
      'error': 'invalid nickname "' + spec.nickname + '"'
    });
  }
  // validate params
  _.forEach(spec.parameters, function(value, parameter) {

    // PGK -- another hack, pulled from swagger-node-restify.js hack
    //  This parses a string for enum in the format "LIST:['option1','option2']" and sets the
    //	enum value accordingly.

//    console.log("parameter: " + JSON.stringify(parameter));

    if (parameter.enum) {
      var avs = parameter.enum.toString();
      var type = avs.split('[')[0];

      console.log("parameter: " + JSON.stringify(parameter));
      console.log("avs: " + avs);

      if (type == 'LIST') {
        var values = avs.match(/\[(.*)\]/g).toString().replace('\[', '').replace('\]', '').split(',');
        parameter.allowableValues = {valueType: type, values: values};
        parameter.enum = values;
      }
      else if (type == 'RANGE') {
        var values = avs.match(/\[(.*)\]/g).toString().replace('\[', '').replace('\]', '').split(',');
        parameter.allowableValues = {valueType: type, min: values[0], max: values[1]};
        parameter.enum = values;
      }

      console.log("parameter: " + JSON.stringify(parameter));
    }

    switch (parameter.paramType) {
      case 'path':
        if (api.path.indexOf('{' + parameter.name + '}') < 0) {
          validationErrors.push({
            'path': api.path,
            'name': parameter.name,
            'error': 'invalid path'
          });
        }
        break;
      case 'query':
        break;
      case 'body':
        break;
      case 'form':
        break;
      case 'header':
        break;
      default:
        validationErrors.push({
          'path': api.path,
          'name': parameter.name,
          'error': 'invalid param type ' + parameter.paramType
        });
        break;
    }
  });

  if (validationErrors.length > 0) {
    console.error(validationErrors);
    return;
  }

  if (!api.operations) {
    api.operations = [];
  }

  // TODO: replace if existing HTTP operation in same api path
  var op = {
    'parameters': spec.parameters,
    'method': spec.method,
    'notes': spec.notes,
    'responseMessages': spec.responseMessages,
    'nickname': spec.nickname,
    'summary': spec.summary,
    'consumes': spec.consumes,
    'produces': spec.produces
  };

  // Add custom fields.
  op = _.extend({}, spec, op);

  if (!spec.type) {
    op.type = 'void';
  }
  api.operations.push(op);

  if (!rootResource.models) {
    rootResource.models = {};
  }
}
