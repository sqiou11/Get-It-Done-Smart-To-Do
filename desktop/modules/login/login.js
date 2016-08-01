'use strict';

angular.module('app')
.controller('LoginController', ['$scope', 'auth', 'store', '$location', loginCtrlFunc]);

function loginCtrlFunc($scope, auth, store, $location){
  auth.signin({
    closable: false,
    authParams: {
      scope: 'openid name email' // Specify the scopes you want to retrieve
    }
  }, function(profile, idToken, accessToken, state, refreshToken) {
    console.log(profile);
    store.set('profile', profile);
    store.set('token', idToken);
    store.set('name', profile.name);
    store.set('id', profile.identities[0].user_id);
    $location.path('/')
  }, function(err) {
    console.log("Error :(", err);
  });
}
