var isArray = require('./object-util.js').isArray;

module.exports = function makeUrl(components, params) {
  components = !isArray(components) ? [components] : components;
  params = params || {};
  return [
    components.filter(function(c) {
      return c !== null && c !== undefined;
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
