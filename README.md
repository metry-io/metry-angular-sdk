# Metry Angular SDK

This repo contains the new SDK for connecting with Metry's API. This is an update of the previous energimolnet-ng. Compared to energimolnet-ng sdk, this sdk generates no endpoint classes, and contains no limitations on what requests you can perform for each endpoint. The endpoints and available HTTP methods are listed in the Metry API documentation.

Installation is now only handled with npm, and you need a bundler, such as webpack or browserify, to use it.

```
npm install metry-angular-sdk
```

## Including in your angular app

```
angular.app('myApp', [
  ... your dependencies...,
  require('metry-angular-sdk')
]) ...
```

## Setting the Base URL

Before performing any api requests, you need to configure what server to use. Unless you have recieved other instructions, use https://app.metry.io as base url.

```
angular.module('myModule').constant('METRY_BASE_URL', 'https://app.metry.io');
```

## Authenticating user

There are currently three ways of authenticating a user.

+ OAuth
+ Private token
+ Manual authentication

The `mryAuth` service has a `isAuthenticated()` method that returns whether the user has either a private or refresh token set.

### Oauth

In order to use [OAuth](http://en.wikipedia.org/wiki/OAuth), you need to register a `client id` and `client secret` with Metry. Contact [support@metry.io](mailto:support@metry.io) if you are interested in developing services on Metry.

When you have recieved your `client id` and `client secret` for your application, you need to configure the auth service to use these values.

```
angular.module('myModule').constant('METRY_AUTH_CONFIG', {
  disabled: false,
  clientId: <your client id>,
  clientSecret: <your client secret>,
  redirectUri: <the uri your app resides at, i.e. a web server or app url scheme>
});
```

Note that the redirectUri is specific for the client, so you'll need to update the client settings on Metry in order to change the URI of your app.

When the SDK detects unauthenticated api access, it will emit a `mry:loginNeeded` event on `$rootScope`. You should listen to this event and redirect the user to the login URL.

```
angular.module('myApp').run([
  '$rootScope',
  '$window',
  'mryAuth',
  function($rootScope, $window, Auth) {
    $rootScope.$on('mry:loginNeeded', function() {
      $window.location.href = Auth.authorizeUrl();
    });
  }
]);
```

Once the authentication is completed, the user will be redirected to the provided `redirectUri`. The oAuth auth code will be appended as a `?code=<auth code>` to the uri. You need to define a state in your app that catches the refresh token and hands it over to the mryAuth service. The mryAuth service will then use this code to fetch a refresh and access token.

```
// Somewhere in your initial code where mryAuth is injected.
// var authCode = // extract code from url, e.g. by using $location.search

mryAuth.handleAuthCode(authCode).then(function() {
  // App is ready to request data from API
})
```

### Private token
While developing, it might be convenient to use your private developer key. This key can be injected using the `setPrivateToken` method on `mryAuth`. Remember to keep it from being commited to public repos.

_In .gitignored config file_

```
angular.module('myConfig').constant('privateToken', 'myVerySecretTokenThatIShallNotCommitToPublicRepos');
```

_In main app_

```
angular.module('myApp').run([
  'mryAuth',
  'privateToken'
  function(auth, privateToken) {
    auth.setPrivateToken(privateToken);
  }
]);
```

The private key will always be used when available, overriding any OAuth authorization. To remove the private token, simply call `setPrivateToken(null)` on the `mryAuth` service.

### Manual authentication
If you manually want to handle OAuth tokens, you can configure the `mryAuth` service to disable OAuth.

```
angular.module('myModule').constant('METRY_AUTH_CONFIG', {disabled: true});
```

## Getting data
This SDK exposes a single `mry` function that is called with a collection name as the argument. That function then returns an object with `get`, `save`, `delete`, `of`, `batch`, and `action`.

```
angular.controller('myController', function(mry) {
  var _this = this;
  _this.meters = [];
  _this.user = null;

  mry('accounts').get('me').then(function(me) {
    _this.user = me;
    
    me.name = '1337 Hacker';
    return mry('accounts').save(me);
  }).then(function() {
    console.log('User is now a 1337 hacker');
  });

  mry('meters').query().then(function(res) {
    _this.meters = res.data;
  });
});
```

The of, batch and action functions are not yet used for any public endpoints and are therefore not documented.

