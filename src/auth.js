// Authentication
// --------------
// Setting the private token will override all other tokens

var makeUrl = require('./util/makeurl')
var ObjectUtil = require('./util/object-util.js')

var PATH_TOKEN = 'oauth/token'
var PATH_AUTHORIZE = 'oauth/authorize'
var KEY_PRIVATE_TOKEN = 'emPrivateToken'
var KEY_REFRESH_TOKEN = 'emRefreshToken'
var KEY_ACCESS_TOKEN = 'emAccessToken'
var KEY_SUBACCOUNT = 'emSubaccount'
var KEY_ORGANIZATION = 'mryOrganization'

module.exports = /* @ngInject */ function (
  $window,
  $http,
  $q,
  METRY_AUTH_CONFIG,
  METRY_BASE_URL
) {
  var requestQueue = []
  var fetchingAccessToken = false
  var tempStorage

  var hasLocalStorage = (function () {
    try {
      if ('localStorage' in $window) {
        $window.localStorage.setItem('test', '1')
        $window.localStorage.removeItem('test')
        return true
      }
    } catch (exception) {}
    tempStorage = {
      _data: {},
      setItem: function (key, value) { this._data[key] = value },
      removeItem: function (key) { this._data[key] = undefined },
      getItem: function (key) { return this._data[key] }
    }

    return false
  })()

  function getPrivateToken () { return getToken(KEY_PRIVATE_TOKEN) }
  function getRefreshToken () { return getToken(KEY_REFRESH_TOKEN) }
  function getAccessToken () { return getToken(KEY_ACCESS_TOKEN) }
  function getSubaccount () { return getToken(KEY_SUBACCOUNT) }
  function getOrganization () { return getToken(KEY_ORGANIZATION) }
  function setPrivateToken (token) { setToken(token, KEY_PRIVATE_TOKEN) }
  function setSubaccount (account) { setToken(account, KEY_SUBACCOUNT) }
  function setOrganization (org) { setToken(org, KEY_ORGANIZATION) }

  function setRefreshToken (token) {
    setToken(token, KEY_REFRESH_TOKEN)
    setAccessToken(null)
  }

  function setAccessToken (token) {
    if (token !== null) {
      token.expires_at = Date.now() + token.expires_in * 1000
    }
    setToken(token, KEY_ACCESS_TOKEN)
  }

  function storage () {
    return hasLocalStorage ? $window.localStorage : tempStorage
  }

  function getToken (key) {
    var value = storage().getItem(key)
    if (value && (value.charAt(0) === '{' || value.charAt(0) === '[')) {
      return JSON.parse(value)
    }
    return value
  }

  function setToken (token, key) {
    if (token) {
      var type = typeof token
      if (type !== 'string' && type !== 'number') {
        token = JSON.stringify(token)
      }
      storage().setItem(key, token)
    } else {
      storage().removeItem(key)
    }
  }

  function isAuthenticated () {
    return (getPrivateToken() !== null || getRefreshToken() !== null)
  }

  function authorize (config) {
    return $q(function (resolve, reject) {
      var token = getPrivateToken()

      // Add subaccount
      config.headers = ObjectUtil.assign(
        {},
        config.headers,
        accountHeaders(config)
      )

      // Check for private api token
      if (token) {
        config.headers = config.headers || {}
        config.headers.Authorization = 'OAuth ' + token
        resolve(config)
        return
      }

      // Check if OAuth is disabled in config. In that case, browser needs to
      // manage the authentication using session cookies
      if (METRY_AUTH_CONFIG.disabled) {
        resolve(config)
        return
      }

      // Check for OAuth refresh token
      var refreshToken = getRefreshToken()

      if (!refreshToken) {
        reject()
        return
      }

      ensureAccessToken(refreshToken).then(function (accessToken) {
        config.headers = config.headers || {}
        config.headers.Authorization = 'Bearer ' + accessToken.access_token
        resolve(config)
      }, function () {
        reject()
      })
    })
  }

  function accountHeaders (config) {
    return config.disableMetryHeaders
      ? {}
      : ObjectUtil.assign(
        {},
        subaccountHeader(getSubaccount()),
        organizationHeader(getOrganization())
      )
  }

  function subaccountHeader (subaccount) {
    return subaccount ? {'X-Subaccount': subaccount} : {}
  }

  function organizationHeader (organization) {
    return organization ? {'X-Organization': organization} : {}
  }

  function ensureAccessToken (refreshToken) {
    return $q(function (resolve, reject) {
      var accessToken = getAccessToken()
      if (isValidToken(accessToken)) {
        // User has a valid access token already, resolve with it
        resolve(accessToken)
      } else {
        // User has no valid token
        requestQueue.push(function (newAccessToken) {
          if (newAccessToken) {
            resolve(newAccessToken)
          } else {
            reject()
          }
        })
        // Only fetch token if we're not already fetching it
        if (!fetchingAccessToken) {
          fetchingAccessToken = true
          fetchAccessToken(refreshToken).then(function (res) {
            var newToken = res.data
            setAccessToken(newToken)
            fetchingAccessToken = false
            // Process any pending requests
            requestQueue.forEach(function (queueFunc) {
              queueFunc(getAccessToken())
            })
            // Clear queue
            requestQueue = []
          }, function () {
            setAccessToken(null)
            fetchingAccessToken = false
            // Process any pending requests
            requestQueue.forEach(function (queueFunc) {
              queueFunc(null)
            })
            // Clear queue
            requestQueue = []
          })
        }
      }
    })
  }

  function isValidToken (token) {
    return (token && token.expires_at > Date.now())
  }

  function fetchAccessToken (refreshToken) {
    return $http.post(makeUrl([METRY_BASE_URL, PATH_TOKEN]), {
      client_id: METRY_AUTH_CONFIG.clientId,
      client_secret: METRY_AUTH_CONFIG.clientSecret,
      grant_type: 'refresh_token',
      scope: METRY_AUTH_CONFIG.scope || 'basic',
      refresh_token: refreshToken
    })
  }

  function authorizeUrl () {
    var params = {
      client_secret: METRY_AUTH_CONFIG.clientSecret,
      client_id: METRY_AUTH_CONFIG.clientId,
      redirect_uri: METRY_AUTH_CONFIG.redirectUri,
      grant_type: 'authorization_code',
      response_type: 'code',
      state: 'mryAuth',
      scope: METRY_AUTH_CONFIG.scope || 'basic'
    }
    return makeUrl([METRY_BASE_URL, PATH_AUTHORIZE], params)
  }

  function handleAuthCode (code) {
    return $http.post(makeUrl([METRY_BASE_URL, PATH_TOKEN]), {
      grant_type: 'authorization_code',
      code: code,
      client_id: METRY_AUTH_CONFIG.clientId,
      client_secret: METRY_AUTH_CONFIG.clientSecret,
      state: 'mryAuth',
      scope: METRY_AUTH_CONFIG.scope || 'basic',
      redirect_uri: METRY_AUTH_CONFIG.redirectUri
    }).then(function (res) {
      var token = res.data
      setRefreshToken(token.refresh_token)
      setAccessToken(token)
    })
  }

  return {
    getPrivateToken: getPrivateToken,
    setPrivateToken: setPrivateToken,
    getRefreshToken: getRefreshToken,
    setRefreshToken: setRefreshToken,
    getOrganization: getOrganization,
    getSubaccount: getSubaccount,
    setSubaccount: setSubaccount,
    setOrganization: setOrganization,
    isAuthenticated: isAuthenticated,
    authorizeUrl: authorizeUrl,
    handleAuthCode: handleAuthCode,
    authorize: authorize
  }
}
