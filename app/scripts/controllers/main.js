'use strict';

/**
 * @ngdoc function
 * @name realTimeTransitApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the realTimeTransitApp
 */
var mainControllers = angular.module('realTimeTransitApp');

mainControllers.controller('MainCtrl', function ($scope, $http) {
  $scope.vehicles = {};

  $scope.getAllVehicles = function(){
    //$http.get('http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=ttc&t=0')
    $http.get('http://restbus.info/api/agencies/ttc/vehicles')
      .success(function(data){
        //console.log(data);
        for(var i=0; i < data.length; i++) {
          if (data[i].id in $scope.vehicles){
            console.log(data[i].id);
          }
          $scope.vehicles[data[i].id] = {
            id: data[i].id,
            position: [data[i].lat, data[i].lon],
            routeId: data[i].routeId,
            secsSinceReport: data[i].secsSinceReport
          };
        }
        //console.log($scope.vehicles);
      });
  };

  $scope.getVehicleUpdate = function(){
    
  }

  $scope.getAllVehicles();

});
