var makeUrl = require('./util/makeurl.js');
var ObjectUtil = require('./util/object-util.js');

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
  return this.req(
    makeConfig(this, object._id, ('_id' in object) ? 'PUT' : 'POST', object, config)
  );
};

MetryResource.prototype.delete = function(id, config) {
  return this.req(makeConfig(this, id, 'DELETE', {}, config));
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
