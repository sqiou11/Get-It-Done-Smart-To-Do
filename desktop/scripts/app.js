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
  $urlRouterProvider.otherwise("/login");

  $stateProvider
    .state('login', {
      url: '/login',
      templateUrl: 'modules/authentication/views/login.html',
      controller: 'LoginController'
    })
    .state('home', {
      url: '/',
      abstract: true,
      controller: 'HomeController',
      templateUrl: 'modules/home/views/home.html'
    })
    .state('home.dash', {
      url: "",
      controller: 'TaskController',
      controllerAs: 'taskCtrl',
      templateUrl: "modules/home/views/main.html"
    })
    .state('home.upcomingTasks', {
      url: "/tasks/upcoming",
      templateUrl: "modules/home/views/upcoming_tasks.html",
      controller: 'TaskController',
      controllerAs: 'taskCtrl'
    })
    .state('home.pastTasks', {
      url: "/tasks/past",
      templateUrl: "modules/home/views/past_tasks.html",
      controller: 'TaskController',
      controllerAs: 'taskCtrl'
    })
    .state('home.activity', {
      url: "/activity",
      templateUrl: "modules/home/views/activity.html"
    })
    .state('home.productivity', {
      //url: "/list",
      //templateUrl: "modules/home/views/main.html",
    })
    .state('home.settings', {
      url: "/settings",
      templateUrl: "modules/home/views/settings.html",
    });
})

/*.config(['$routeProvider', function ($routeProvider) {
  $routeProvider
    .when('/login', {
      controller: 'LoginController',
      templateUrl: 'modules/authentication/views/login.html'
    })

    .when('/', {
      controller: 'HomeController',
      templateUrl: 'modules/home/views/home.html'
    })

    //.otherwise({ redirectTo: '/login' });
}])*/

.run(['$rootScope', '$location', '$cookieStore', '$http', function ($rootScope, $location, $cookieStore, $http) {
  // keep user logged in after page refresh
  $rootScope.globals = $cookieStore.get('globals') || {};
  if ($rootScope.globals.currentUser) {
    $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata; // jshint ignore:line
  }

  $rootScope.$on('$locationChangeStart', function (event, next, current) {
    // redirect to login page if not logged in
    if ($location.path() !== '/login' && !$rootScope.globals.currentUser) {
      $location.path('/login');
    }
  });
}]);
