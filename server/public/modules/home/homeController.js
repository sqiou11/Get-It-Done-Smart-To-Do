'use strict';

angular.module('app')

.controller('HomeController', ['$scope', 'auth', 'store', '$location', function ($scope, auth, store, $location) {
  $scope.user = store.get('name');
  $scope.auth = auth;

  $scope.logout = function() {
    console.log('logging out');
    store.remove('profile');
    store.remove('token');
    store.remove('name');
    store.remove('nickname');
    auth.signout();
    $location.url('/login');
  }
}]);
