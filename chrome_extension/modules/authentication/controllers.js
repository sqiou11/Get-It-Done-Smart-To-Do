'use strict';

angular.module('Authentication')

.controller('LoginController',
    ['$scope', '$rootScope', '$location', 'AuthenticationService',
    function ($scope, $rootScope, $location, AuthenticationService) {
        // reset login status
        AuthenticationService.ClearCredentials();

        $scope.login = function () {
            $scope.dataLoading = true;
            AuthenticationService.Login($scope.username, $scope.password, function (response) {
                if (response.success) {
                  chrome.runtime.getBackgroundPage(function(bgPage) {
                      console.log("got background page");
                      bgPage.startSession($scope.username);
                  });
                  AuthenticationService.SetCredentials($scope.username, $scope.password);
                  $location.path('/');
                } else {
                  $scope.error = response.message;
                  $scope.dataLoading = false;
                }
            });
        };
    }]);
