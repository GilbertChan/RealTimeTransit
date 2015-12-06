'use strict';

/**
 * @ngdoc function
 * @name realTimeTransitApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the realTimeTransitApp
 */
var mainControllers = angular.module('realTimeTransitApp');

mainControllers.controller('MainCtrl', function ($scope, $http, $interval, NgMap) {
  $scope.vehicles = {};
  var circles = {
    markers: {},
    infoWindows: {}
  };

  /*$scope.mapOptions = {
    zoom: '15',
    minZoom: '12',
    maxZoom: '17',
    center: '43.65012, -79.390945',
    defaultStyle: 'false',
    panControl: 'true',
    panControlOptions: '{position:\'BOTTOM_CENTER\'}',
    mapTypeControl: 'false',
    mapTypeControlOptions: '{style:\'DROPDOWN_MENU\', position:\'TOP_LEFT\'}',
    zoomControl: 'true',
    zoomControlOptions: '{style:\'LARGE\', position:\'RIGHT_BOTTOM\'}',
    streetViewControl: 'true',
    streetViewControlOptions: '{position:\'RIGHT_BOTTOM\'}',
    scaleControl: 'true'
  };*/

  var circleOptions = {
    radius: 18,
    clickable: true,
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeOpacity: 0,
    strokeWeight: 0.0001
  };

  var infoWindowOptions = {
    /*disableAutoPan: false,*/
    maxWidth: 85
  };

  var infoWindow = new google.maps.InfoWindow(infoWindowOptions);

  $scope.getAllVehicles = function(){
    //$http.get('http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=ttc&t=0')
    console.log('call');
    //Get bounds of map
    var mapBounds = null;
    var northBound = null;
    var eastBound = null;
    var southBound = null;
    var westBound = null;

    NgMap.getMap().then(function(map) {
      //set the map where the circles are to be rendered
      circleOptions.map = map;

      //get visible map bounds
      mapBounds = map.getBounds();
      northBound = mapBounds.getNorthEast().lat(); // LatLng of the north-east corner
      eastBound = mapBounds.getNorthEast().lng(); // LatLng of the north-east corner
      southBound = mapBounds.getSouthWest().lat(); // LatLng of the north-east corner
      westBound = mapBounds.getSouthWest().lng(); // LatLng of the north-east corner
      //console.log(northBound, eastBound, southBound, westBound);

      $http.get('http://restbus.info/api/agencies/ttc/vehicles')
        .success(function(data){
          //console.log(data);
          var numNew = 0;
          var numChanged = 0;

          for(var i=0; i < data.length; i++) {
            var vehicle = data[i];
            var newPosition = new google.maps.LatLng(parseFloat(vehicle.lat), parseFloat(vehicle.lon));
           
            var locationAge = vehicle.secsSinceReport;
            var vehicleColor = '#000000';
            if (locationAge >= 30) {
              vehicleColor = '#CC0000';
            } else if (locationAge >= 15) {
              vehicleColor = '#000000';
            } else {
              vehicleColor = '#008900';
            }

            //New Vehicle to add to the Map
            if (!(vehicle.id in $scope.vehicles)) {
              numNew = numNew+1;
              $scope.vehicles[vehicle.id] = {
                id: vehicle.id,
                lat: vehicle.lat,
                lon: vehicle.lon,
                /*position: [vehicle.lat, vehicle.lon],*/
                routeId: vehicle.routeId,
                secsSinceReport: vehicle.secsSinceReport,
                radius: circleOptions.radius,
                fillColor: vehicleColor,
                fillOpacity: circleOptions.fillOpacity,
                strokeColor: circleOptions.strokeColor,
                strokeOpacity: circleOptions.strokeOpacity,
                strokeweight: circleOptions.strokeWeight
              };

              //Set circle options and create circle
              circleOptions.center = newPosition;
              circleOptions.fillColor = vehicleColor;
              circles.markers[vehicle.id] = new google.maps.Circle(circleOptions);
              var vehicleCircle = circles.markers[vehicle.id];
              //circles.markers[vehicle.id].setMap(map);

              google.maps.event.addListener(vehicleCircle, 'click', (function(vehicleCircle, vehicle) {
                return function() {
                  //Set info window details an create
                  infoWindow.setContent('<p><b>Route: </b> ' + vehicle.routeId + '</p><p><b>Vehicle ID:</b> ' + vehicle.id);
                  infoWindow.setPosition(vehicleCircle.getCenter());
                  infoWindow.open(map);
                };
              })(vehicleCircle, vehicle));

              //console.log('New Vehicle: ', $scope.vehicles[vehicle.id]);
            } else {
              //Vehicle has moved
              if ($scope.vehicles[vehicle.id].lat !== vehicle.lat){
                numChanged = numChanged+1;

                /*$scope.vehicles[vehicle.id].lat = vehicle.lat;
                $scope.vehicles[vehicle.id].lon = vehicle.lon;
                $scope.vehicles[vehicle.id].position = [vehicle.lat, vehicle.lon];
                $scope.vehicles[vehicle.id].secsSinceReport = vehicle.secsSinceReport;
                $scope.vehicles[vehicle.id].fillColor = '#0000FF';*/
                $scope.vehicles[vehicle.id] = {
                  id: vehicle.id,
                  lat: vehicle.lat,
                  lon: vehicle.lon,
                  /*position: [vehicle.lat, vehicle.lon],*/
                  routeId: vehicle.routeId,
                  secsSinceReport: vehicle.secsSinceReport,
                  radius: circleOptions.radius,
                  fillColor: '#0000FF',
                  fillOpacity: circleOptions.fillOpacity,
                  strokeColor: circleOptions.strokeColor,
                  strokeOpacity: circleOptions.strokeOpacity,
                  strokeweight: circleOptions.strokeWeight
                };

                circles.markers[vehicle.id].setOptions({
                  center: newPosition,
                  fillColor: vehicleColor
                });
                //console.log('Existing Vehicle Changed: ', $scope.vehicles[vehicle.id]);
              } else {
                circles.markers[vehicle.id].setOptions({
                  fillColor: vehicleColor
                });
              }
            }
          }
          //console.log($scope.vehicles);
          console.log(Object.keys($scope.vehicles).length, 'numNew: ', numNew, 'numChanged: ', numChanged);
        });
    });
  };

  $scope.getVehicleUpdate = function(){
    
  };
  
  $scope.getAllVehicles();
  $interval($scope.getAllVehicles, 15000);
});
