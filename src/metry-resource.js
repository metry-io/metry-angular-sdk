var makeUrl = require('./util/makeurl.js');
var ObjectUtil = require('./util/object-util.js');
var SearchUtil = require('./util/search-util.js');

var NON_QUERY_KEYS = ['skip', 'limit', 'sort', 'q'];

function MetryResource(request, resource, parent, parentId) {
  this.resource = resource;
  this.parent = parent;
  this.parentId = parentId;
  this.req = request;
}

module.exports = MetryResource;

MetryResource.prototype.get = function(id, config) {
  return this.req(makeConfig(this, id, 'GET', {}, config));
};

MetryResource.prototype.getData = function(id, granularity, ranges, metrics) {
  metrics = metrics || ['energy'];
  metrics = ObjectUtil.isArray(metrics) ? metrics : [metrics];
  ranges = ObjectUtil.isArray(ranges) ? ranges : [ranges];

  return this.req({
    method: 'GET',
    url: makeUrl([resourceUrl(this), id, granularity, ranges.join('+')]),
    params: {
      metrics: metrics.join(',')
    }
  });
};

MetryResource.prototype.query = function(params, config) {
  return this.req(makeConfig(this, null, 'GET', params, config));
};

MetryResource.prototype.save = function(object, config) {
  var method = ('_id' in object) ? 'PUT' : 'POST';
  var id = object._id;
  if ('_id' in object) { delete object._id; }
  return this.req(
    makeConfig(this, id, method, object, config)
  );
};

MetryResource.prototype.delete = function(id, config) {
  return this.req(makeConfig(this, id, 'DELETE', {}, config));
};

MetryResource.prototype.search = function(query, config) {
  var method = mergedMethod('GET', config);
  var data = makeSearchQuery(query);
  return this.req(ObjectUtil.assign({
    method: method,
    url: makeUrl(['search', this.resource]),
    data: useData(method) ? data : null,
    params: !useData(method) ? ObjectUtil.filterEmptyValues(data) : null
  }, config || {}));
};

MetryResource.prototype.batch = function (path, ids, data, config) {
  return this.req(
    makeConfig(this, null, 'PUT', batchData(ids, data), config, path)
  );
};

MetryResource.prototype.action = function(action, id, data, config) {
  return this.req(makeConfig(this, id, 'PUT', data, config, action));
};

MetryResource.prototype.of = function (parent, parentId) {
  return new MetryResource(this.req, this.resource, parent, parentId);
};

function makeConfig(resource, id, method, data, extraConfig, action) {
  method = mergedMethod(method, extraConfig);
  return ObjectUtil.assign({
    method: method,
    url: resourceUrl(resource, id, action),
    data: useData(method) ? data : null,
    params: !useData(method) ? ObjectUtil.filterEmptyValues(data) : null
  }, extraConfig || {});
}

function useData(method) {
  return (['PUT', 'POST'].indexOf(method) !== -1);
}

function mergedMethod(method, extraConfig) {
  if (typeof extraConfig !== 'object') { return method; }
  return ObjectUtil.isDefined(extraConfig.method) ? extraConfig.method : method;
}

function resourceUrl(resource, id, action) {
  return makeUrl([
    resource.parent,
    resource.parentId,
    resource.resource,
    id,
    action
  ]);
}

function batchData(ids, data) {
  return ids.map(function(id) { return ObjectUtil.assign({_id: id}, data); });
}

// This function creates a merged elastic search query from a filter
// object. It merges all params related to searching, but leaves sorting
// and pagination as they are.
// This means you can both use old-style params like box=active and q=box:active
// in the same query, which can be useful if you want to let the user be in
// charge of the q parameter, and yet limit the search.
function makeSearchQuery(filter) {
  var query = {};
  var q = [];
  Object.keys(filter).forEach(function(k) {
    if (NON_QUERY_KEYS.indexOf(k) !== -1) {
      query[k] = filter[k];
    } else {
      q.push({key: k, value: filter[k]});
    }
  });
  query.q = [filter.q, SearchUtil.makeQuery(q)]
    .filter(function(r) { return r !== null && typeof r !== 'undefined'; })
    .join(' AND ');
  return query;
}
