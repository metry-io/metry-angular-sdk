var ObjectUtil = require('./object-util.js');

function queryParse(queryString) {
  return queryString
    .split('AND')
    .map(function(s) {
      var components = s.split(':');
      if (components.length !== 2) { return null; }
      var key = components[0].trim();
      var value = components[1].trim();
      return {
        key: key,
        value: value,
        tag: key + ': ' + value,
        autocomplete: {
          key: key,
          value: value,
          type: key
        }
      };
    })
    .filter(function(c) { return c !== null; });
}

function queryTransform(queryArray) {
  if (!ObjectUtil.isArray(queryArray) || queryArray.length === 0) {
    return null;
  }
  return queryArray.filter(function(q) {
    return (q &&
            'key' in q &&
            'value' in q &&
            q.value !== null &&
            typeof q.value !== 'undefined' &&
            (typeof q.value !== 'string' || q.value.length > 0));
  })
  .map(function(q) {
    return [q.key, q.value].join(':');
  })
  .filter(function(q) { return q !== null; })
  .join(' AND ');
}

module.exports = {
  parse: queryParse,
  makeQuery: queryTransform
};
