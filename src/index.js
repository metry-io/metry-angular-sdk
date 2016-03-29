var angular = require('angular');

var MODULE_NAME = 'metry';

if (typeof module === 'object') {
  module.exports = MODULE_NAME;
}

angular.module(MODULE_NAME, [])
.factory('mryDateUtil', function() { return require('./util/date-util.js'); })
.factory('mryAuth', require('./auth.js'))
.factory('mry', require('./metry-sdk.js'));
