var ObjectUtil = require('./object-util.js');

module.exports = function makeUrl(components, params) {
  components = !ObjectUtil.isArray(components) ? [components] : components;
  params = params || {};
  return [
    components.filter(function(c) {
      return ObjectUtil.isDefined(c);
    }).map(function(c) {
      return c.replace(/^\/|\/$/, '');
    }).join('/'),
    Object.keys(params).map(function(k) {
      return k + '=' + encodeURIComponent(params[k]);
    }).join('&')
  ].filter(function(c) {
    return c.length > 0;
  }).join('?');
};
