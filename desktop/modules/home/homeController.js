'use strict';

angular.module('Home')

.controller('HomeController', ['$scope', '$rootScope', '$http', function ($scope, $rootScope, $http) {
  $scope.user = $rootScope.globals.currentUser.username;
}]);
