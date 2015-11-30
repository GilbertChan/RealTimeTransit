'use strict';

/**
 * @ngdoc function
 * @name realTimeTransitApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the realTimeTransitApp
 */
var mainControllers = angular.module('realTimeTransitApp');

mainControllers.controller('MainCtrl', function ($scope, $http, NgMap) {
  $scope.vehicles = {};

  $scope.getAllVehicles = function(){
    //$http.get('http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=ttc&t=0')

    //Get bounds of map
    var mapBounds = null;
    var northBound = null;
    var eastBound = null;
    var southBound = null;
    var westBound = null;

    NgMap.getMap().then(function(map) {
      mapBounds = map.getBounds();
      northBound = mapBounds.getNorthEast().lat(); // LatLng of the north-east corner
      eastBound = mapBounds.getNorthEast().lng(); // LatLng of the north-east corner
      southBound = mapBounds.getSouthWest().lat(); // LatLng of the north-east corner
      westBound = mapBounds.getSouthWest().lng(); // LatLng of the north-east corner
      console.log(northBound, eastBound, southBound, westBound);

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
    });
  };

  $scope.getVehicleUpdate = function(){
    
  };

  $scope.getAllVehicles();

});
