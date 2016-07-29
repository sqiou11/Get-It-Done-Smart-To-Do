'use strict';

angular.module('app')
.controller('LoginController', ['$scope', 'auth', 'store', '$location', loginCtrlFunc]);

function loginCtrlFunc($scope, auth, store, $location){
  var lock = new Auth0Lock('rGCwNjTrWSe5RfYPXB4BcuNwIM5JWBfR', 'sqiou11.auth0.com', {
    container: 'root',
    rememberLastLogin: false,
    auth: {
      params: {
        scope: 'openid email' // Learn about scopes: https://auth0.com/docs/scopes
      }
    }
  });
  lock.show();
}
