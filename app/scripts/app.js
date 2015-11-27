'use strict';

/**
 * @ngdoc overview
 * @name realTimeTransitApp
 * @description
 * # realTimeTransitApp
 *
 * Main module of the application.
 */
angular
  .module('realTimeTransitApp', [
    'ngAnimate',
    'ngAria',
    'ngCookies',
    'ngMessages',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ngMap'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
