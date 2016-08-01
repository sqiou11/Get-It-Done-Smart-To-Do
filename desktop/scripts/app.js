'use strict';

angular.module('app', [
    'ngRoute',
    'ngCookies',
    'auth0',
    'angular-storage',
    'angular-jwt',
    'ui.router'
])

.config(['$stateProvider', '$urlRouterProvider', 'authProvider', function myAppConfig($stateProvider, $urlRouterProvider, authProvider) {
  $urlRouterProvider.otherwise("/");
  $stateProvider
    .state('login', {
      url: '/login',
      templateUrl: 'modules/login/login.html',
      controller: 'LoginController'
    })
    .state('home', {
      url: '/',
      abstract: true,
      controller: 'HomeController',
      templateUrl: 'modules/home/views/home.html',
      data: { requiresLogin: true }
    })
    .state('home.dash', {
      url: "",
      controller: 'TaskController',
      controllerAs: 'taskCtrl',
      templateUrl: "modules/home/views/main.html",
      data: { requiresLogin: true }
    })
    .state('home.upcomingTasks', {
      url: "/tasks/upcoming",
      templateUrl: "modules/home/views/upcoming_tasks.html",
      controller: 'TaskController',
      controllerAs: 'taskCtrl',
      data: { requiresLogin: true }
    })
    .state('home.pastTasks', {
      url: "/tasks/past",
      templateUrl: "modules/home/views/past_tasks.html",
      controller: 'TaskController',
      controllerAs: 'taskCtrl',
      data: { requiresLogin: true }
    })
    .state('home.activity', {
      url: "/activity",
      templateUrl: "modules/home/views/activity.html",
      data: { requiresLogin: true }
    })
    .state('home.productivity', {
      //url: "/list",
      //templateUrl: "modules/home/views/main.html",
    })
    .state('home.settings', {
      url: "/settings",
      templateUrl: "modules/home/views/settings.html",
      data: { requiresLogin: true }
    });

  //Configure Auth0 with credentials
  authProvider.init({
    domain: 'sqiou11.auth0.com',
    clientID: 'rGCwNjTrWSe5RfYPXB4BcuNwIM5JWBfR',
    loginState: 'login'
  });

  //Called when login is successful
  /*authProvider.on('loginSuccess', ['$location', 'profilePromise', 'idToken', 'store', function($location, profilePromise, idToken, store) {
    // Successfully log in
    // Access to user profile and token
    console.log('loginSuccess');
    profilePromise.then(function(profile){
      // profile
      store.set('profile', profile);
      store.set('token', idToken);
      store.set('name', profile.nickname);
      $location.path('/');
    });
  }]);

  //Called when login fails
  authProvider.on('loginFailure', function() {
    // If anything goes wrong
    $location.path('/login');
  });*/
}])

.run(['$rootScope', 'auth', 'store', 'jwtHelper', '$location', function($rootScope, auth, store, jwtHelper, $location) {
  // Listen to a location change event
  $rootScope.$on('$locationChangeStart', function() {
    // Grab the user's token
    console.log(localStorage.getItem('token'));
    console.log(store.get('token'));
    var token = store.get('token');
    // Check if token was actually stored
    if (token) {
      // Check if token is yet to expire
      if (!jwtHelper.isTokenExpired(token)) {
        // Check if the user is not authenticated
        if (!auth.isAuthenticated) {
          // Re-authenticate with the user's profile
          auth.authenticate(store.get('profile'), token);
        }
      } else {
        // Show the login page
        $location.path('/login');
      }
    }
  });
}]);
