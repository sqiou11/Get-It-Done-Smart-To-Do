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
      controller: 'HomeController',
      controllerAs: 'home',
      templateUrl: 'modules/home/views/home.html',
      data: { requiresLogin: true }
    });
  //Configure Auth0 with credentials
  authProvider.init({
    domain: 'sqiou11.auth0.com',
    clientID: 'rGCwNjTrWSe5RfYPXB4BcuNwIM5JWBfR',
    loginState: 'login'
  });

  //Called when login is successful
  authProvider.on('loginSuccess', ['$location', 'profilePromise', 'idToken', 'store', function($location, profilePromise, idToken, store) {
    // Successfully log in
    // Access to user profile and token
    console.log('success');
    profilePromise.then(function(profile){
      // profile
      console.log(idToken);
      store.set('profile', profile);
      store.set('token', idToken);
      store.set('name', profile.nickname);
      chrome.runtime.getBackgroundPage(function(bgPage) {
        bgPage.startSession();
        $location.url('/');
      });
    });
  }]);

  //Called when login fails
  authProvider.on('loginFailure', function() {
    // If anything goes wrong
    $location.url('/login');
  });
}])

.run(['$rootScope', 'auth', 'store', 'jwtHelper', '$location', function($rootScope, auth, store, jwtHelper, $location) {
  // Listen to a location change event
  $rootScope.$on('$locationChangeStart', function() {
    // Grab the user's token
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
