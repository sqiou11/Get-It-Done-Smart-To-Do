'use strict';

// declare modules
angular.module('Authentication', []);
angular.module('Home', []);

angular.module('RootController', [
    'Authentication',
    'Home',
    'ngRoute',
    'ngCookies',
    'ui.router'
])

.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise("/");

  $stateProvider
    .state('login', {
      url: '/login',
      templateUrl: 'modules/authentication/views/login.html',
      controller: 'LoginController'
    })
    .state('home', {
      url: '/',
      controller: 'HomeController',
      controllerAs: 'home',
      templateUrl: 'modules/home/views/home.html'
    });
})

.run(['$rootScope', '$location', '$cookieStore', '$http', function ($rootScope, $location, $cookieStore, $http) {
  // keep user logged in after page refresh
  $rootScope.globals = $cookieStore.get('globals') || {};
  if ($rootScope.globals.currentUser) {
    $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata; // jshint ignore:line
  }

  $rootScope.$on('$locationChangeStart', function (event, next, current) {
    chrome.runtime.getBackgroundPage(function(bgPage) {
        console.log("got background page " + bgPage.getSession());
        // redirect to login page if not logged in
        if ($location.path() !== '/login' && !bgPage.getSession()) {
          $location.path('/login');
        }
    });

  });
}]);
