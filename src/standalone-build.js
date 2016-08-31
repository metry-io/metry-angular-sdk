if (typeof window.angular !== 'undefined') {
  window.angular.module('metry', [])
  .factory('mryDateUtil', function () { return require('./util/date-util.js') })
  .factory('mryAuth', require('./auth.js'))
  .factory('mry', require('./metry-sdk.js'))
}
