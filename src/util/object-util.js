module.exports = {
  assign: assign,
  filterEmptyValues: filterEmptyValues,
  isArray: isArray,
  isString: isString
};

function filterEmptyValues(object) {
  var resource = {};
  for (var key in object) {
    if (!object.hasOwnProperty(key)) { continue; }
    var value = object[key];
    var isString = isString(value);
    if (value !== null && value !== undefined &&
        ((isString && value.length > 0) || !isString)) {
          resource[key] = value;
        }
  }
  return resource;
}

function assign(target, source) {
  var from;
  var to = Object(target || {});
  var symbols;
  for (var s = 1; s < arguments.length; s++) {
    from = Object(arguments[s]);
    for (var key in from) {
      if (from.hasOwnProperty(key)) {
        to[key] = from[key];
      }
    }
    if (Object.getOwnPropertySymbols) {
      symbols = Object.getOwnPropertySymbols(from);
      for (var i = 0; i < symbols.length; i++) {
        if (from.propIsEnumerable(symbols[i])) {
          to[symbols[i]] = from[symbols[i]];
        }
      }
    }
  }
  return to;
}

function isString(object) {
  return typeof object === 'string';
}

function isArray(object) {
  return Object.prototype.toString.call(object) === '[object Array]';
}
