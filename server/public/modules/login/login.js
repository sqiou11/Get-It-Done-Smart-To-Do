'use strict';

angular.module('app')
.controller('LoginController', ['$scope', 'auth', 'store', '$location', loginCtrlFunc]);

function loginCtrlFunc($scope, auth, store, $location){
  auth.signin({
    closable: false,
    authParams: {
      scope: 'openid name email' // Specify the scopes you want to retrieve
    }
  });
}
