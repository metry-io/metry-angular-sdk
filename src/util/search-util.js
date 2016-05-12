var ObjectUtil = require('./object-util.js');

// Converts an array of objects with {key, value} to a query-string on format
// q=key1:value1 AND key2:value2 AND value3
// If key is '' then only value is appended.
// If a value is null, undefined, or empty string, it is ignored
exports.makeQuery = function makeQuery(queryArray) {
  if (!ObjectUtil.isArray(queryArray) || queryArray.length === 0) {
    return null;
  }
  return queryArray
    .filter(function(q) {
      return (q && 'key' in q && 'value' in q && q.value !== null &&
              q.useLegacy !== true &&
              typeof q.value !== 'undefined' &&
              (typeof q.value !== 'string' || q.value.length > 0));
    })
    .map(function(q) {
      return (q.key.length === 0) ? q.value : [q.key, q.value].join(':');
    })
    .filter(function(q) { return q !== null; })
    .join(' AND ');
};
