var MetryResource = require('./metry-resource.js');
var makeUrl = require('./util/makeurl.js');

var PATH_API_VERSION =        'api/2.0';
var EVENT_LOGIN_NEEDED =      'mry:loginNeeded';

module.exports = /*@ngInject*/ function(
  $http,
  $q,
  $rootScope,
  mryAuth,
  METRY_BASE_URL
) {
  function request(config) {
    config.url = makeUrl([METRY_BASE_URL, PATH_API_VERSION, config.url]);
    return mryAuth
      .authorize(config)
      .then(function(config) {
        return $http(config)
          .then(parseResponse, handleError);
      }, handleError);
  }

  function parseResponse(res) {
    if (!(res.data && 'count' in res.data && 'limit' in res.data && 'skip' in res.data)) {
      return res.data.data;
    } else {
      return {
        data: res.data.data,
        pagination: {
          skip: res.data.skip,
          limit: res.data.limit,
          count: res.data.count,
          page: 1 + (res.data.skip / res.data.limit),
          from: (res.data.count === 0) ? 0 : res.data.skip + 1,
          to: (res.data.skip + res.data.limit > res.data.count) ? res.data.count : res.data.skip + res.data.limit
        }
      };
    }
  }

  function handleError(res) {
    if (typeof res === 'object' && res.status === 401) {
      mryAuth.setPrivateToken(null);
    }
    if (!res || res.status === 401) {
      $rootScope.$broadcast(EVENT_LOGIN_NEEDED);
    }
    return $q.reject((res && res.data && res.data.errors) ? res.data.errors : res);
  }

  // Main api function. Usage:
  // mry('meters').get('<meter id>');
  // mry('consumption_stats').of('accounts', '<account id>').get();
  // mry('robots').save(robotObject);

  function mry(resource) {
    return new MetryResource(request, resource);
  }

  mry.request = request;

  return mry;
};

