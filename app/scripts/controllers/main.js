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
  var circles = {};
  var arrows = {};

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
    fillColor: '#008900',
    strokeColor: '#CC0000',
    strokeWeight: 2
  };

  var arrowOptions = {
    icon: {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 3,
      fillColor: '#008900',
      strokeColor: '#CC0000',
      strokeWeight: 1
    }
};

  var infoWindowOptions = {
    /*disableAutoPan: false,*/
    maxWidth: 85
  };

  var infoWindow = new google.maps.InfoWindow(infoWindowOptions);

  $scope.getAllVehicles = function(){
    //$http.get('http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=ttc&t=0')
    var startTime = new Date();
    var dataFinishTime;
    var finishTime;
    console.log('start');
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
          dataFinishTime = new Date();
          console.log('data returned - ', dataFinishTime - startTime);
          var numNew = 0;
          var numChanged = 0;

          for(var i=0; i < data.length; i++) {
            var vehicle = data[i];
            var newPosition = new google.maps.LatLng(parseFloat(vehicle.lat), parseFloat(vehicle.lon));
           
            var locationAge = vehicle.secsSinceReport;
            //var vehicleColor = '#008900';//'#000000';
            var vehicleCircle;

            //var circleOpacity = (100 - 5 / 3 * locationAge) / 100;
            var circleOpacity = (100 - Math.pow(1.6, locationAge/3)) / 100;
            var strokeOpacity = 0;
            if (circleOpacity < 0) { 
              circleOpacity = 0;
              strokeOpacity = 1;
            } else if (circleOpacity < 0.2) {
              strokeOpacity = 1;
            } else {
              strokeOpacity = 0;
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
                heading: vehicle.heading,
                secsSinceReport: locationAge,
              };

              //Set circle options and create circle
              circleOptions.center = newPosition;
              //circleOptions.fillColor = vehicleColor;
              circleOptions.fillOpacity = circleOpacity;
              circleOptions.strokeOpacity = strokeOpacity;
              circles[vehicle.id] = new google.maps.Circle(circleOptions);
              vehicleCircle = circles[vehicle.id];
              //circles[vehicle.id].setMap(map);

              google.maps.event.addListener(vehicleCircle, 'mouseover', (function(vehicleCircle, vehicle) {
                return function() {
                  //Set info window details an create
                  infoWindow.setContent('<p><b>Route: </b> ' + vehicle.routeId + '</p><p><b>Vehicle ID:</b> ' + vehicle.id + '</p><b>Update :</b> ' + vehicle.secsSinceReport + '</p>');
                  infoWindow.setPosition(vehicleCircle.getCenter());
                  infoWindow.open(map);
                };
              })(vehicleCircle, vehicle));

              //console.log('New Vehicle: ', $scope.vehicles[vehicle.id]);
            } else {
              //Vehicle has moved
              if ($scope.vehicles[vehicle.id].lat !== vehicle.lat){
                numChanged = numChanged+1;

                $scope.vehicles[vehicle.id] = {
                  id: vehicle.id,
                  lat: vehicle.lat,
                  lon: vehicle.lon,
                  /*position: [vehicle.lat, vehicle.lon],*/
                  routeId: vehicle.routeId,
                  heading: vehicle.heading,
                  secsSinceReport: locationAge,
                };

                circles[vehicle.id].setOptions({
                  center: newPosition,
                  //fillColor: vehicleColor,
                  fillOpacity: circleOpacity,
                  strokeOpacity: strokeOpacity
                });

                vehicleCircle = circles[vehicle.id];

                google.maps.event.addListener(vehicleCircle, 'mouseover', (function(vehicleCircle, vehicle) {
                  return function() {
                    //Set info window details an create
                    infoWindow.close();
                    infoWindow.setContent('<p><b>Route: </b> ' + vehicle.routeId + '</p><p><b>Vehicle ID:</b> ' + vehicle.id + '</p><b>Update :</b> ' + vehicle.secsSinceReport + '</p>');
                    infoWindow.setPosition(vehicleCircle.getCenter());
                    infoWindow.open(map);
                  };
                })(vehicleCircle, vehicle));

                //console.log('Existing Vehicle Changed: ', $scope.vehicles[vehicle.id]);
              } else {
                circles[vehicle.id].setOptions({
                  //fillColor: vehicleColor,
                  fillOpacity: circleOpacity,
                  strokeOpacity: strokeOpacity
                });

                vehicleCircle = circles[vehicle.id];

                google.maps.event.addListener(vehicleCircle, 'mouseover', (function(vehicleCircle, vehicle) {
                  return function() {
                    //Set info window details an create
                    infoWindow.close();
                    infoWindow.setContent('<p><b>Route: </b> ' + vehicle.routeId + '</p><p><b>Vehicle ID:</b> ' + vehicle.id + '</p><b>Update :</b> ' + vehicle.secsSinceReport + '</p>');
                    infoWindow.setPosition(vehicleCircle.getCenter());
                    infoWindow.open(map);
                  };
                })(vehicleCircle, vehicle));
              }
            }
          }
          //console.log($scope.vehicles);
          finishTime = new Date();
          console.log(Object.keys($scope.vehicles).length, 'numNew: ', numNew, 'numChanged: ', numChanged, 'Finish Duration - ', finishTime - startTime, 'Calc Duration - ', finishTime - dataFinishTime);
        });
    });
  };



  $scope.getAllVehicles2 = function(){
    //$http.get('http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=ttc&t=0')
    var startTime = new Date();
    var dataFinishTime;
    var finishTime;
    console.log('start');
    //Get bounds of map
    var mapBounds = null;
    var northBound = null;
    var eastBound = null;
    var southBound = null;
    var westBound = null;

    NgMap.getMap().then(function(map) {
      //set the map where the circles are to be rendered
      arrowOptions.map = map;

      //get visible map bounds
      mapBounds = map.getBounds();
      northBound = mapBounds.getNorthEast().lat(); // LatLng of the north-east corner
      eastBound = mapBounds.getNorthEast().lng(); // LatLng of the north-east corner
      southBound = mapBounds.getSouthWest().lat(); // LatLng of the north-east corner
      westBound = mapBounds.getSouthWest().lng(); // LatLng of the north-east corner
      //console.log(northBound, eastBound, southBound, westBound);

      $http.get('http://restbus.info/api/agencies/ttc/vehicles')
        .success(function(data){
          dataFinishTime = new Date();
          console.log('data returned - ', dataFinishTime - startTime);
          var numNew = 0;
          var numChanged = 0;

          for(var i=0; i < data.length; i++) {
            var vehicle = data[i];
            var newPosition = new google.maps.LatLng(parseFloat(vehicle.lat), parseFloat(vehicle.lon));
           
            var locationAge = vehicle.secsSinceReport;
            var arrowDirection = vehicle.heading;
            //var vehicleColor = '#008900';//'#000000';
            var vehicleArrow;

            //var arrowOpacity = (100 - 5 / 3 * locationAge) / 100;
            var arrowOpacity = (100 - Math.pow(1.6, locationAge/3)) / 100;
            var strokeOpacity = 0;
            if (arrowOpacity < 0) { 
              arrowOpacity = 0;
              strokeOpacity = 1;
            } else if (arrowOpacity < 0.2) {
              strokeOpacity = 1;
            } else {
              strokeOpacity = 0;
            }

            arrowOptions.icon.rotation = parseFloat(arrowDirection);

            //New Vehicle to add to the Map
            if (!(vehicle.id in $scope.vehicles)) {
              numNew = numNew+1;
              $scope.vehicles[vehicle.id] = {
                id: vehicle.id,
                lat: vehicle.lat,
                lon: vehicle.lon,
                /*position: [vehicle.lat, vehicle.lon],*/
                routeId: vehicle.routeId,
                heading: arrowDirection,
                secsSinceReport: locationAge,
              };

              //Set circle options and create circle
              arrowOptions.position = newPosition;
              //arrowOptions.icon.fillColor = vehicleColor;
              arrowOptions.icon.fillOpacity = arrowOpacity;
              arrowOptions.icon.strokeOpacity = strokeOpacity;
              arrows[vehicle.id] = new google.maps.Marker(arrowOptions);
              vehicleArrow = arrows[vehicle.id];
              //arrows[vehicle.id].setMap(map);

              google.maps.event.addListener(vehicleArrow, 'mouseover', (function(vehicleArrow, vehicle) {
                return function() {
                  //Set info window details an create
                  infoWindow.setContent('<p><b>Route: </b> ' + vehicle.routeId + '</p><p><b>Vehicle ID:</b> ' + vehicle.id + '</p><b>Update :</b> ' + vehicle.secsSinceReport + '</p>');
                  infoWindow.setPosition(vehicleArrow.getPosition());
                  infoWindow.open(map);
                };
              })(vehicleArrow, vehicle));

              //console.log('New Vehicle: ', $scope.vehicles[vehicle.id]);
            } else {
              //Vehicle has moved
              if ($scope.vehicles[vehicle.id].lat !== vehicle.lat){
                numChanged = numChanged+1;

                $scope.vehicles[vehicle.id] = {
                  id: vehicle.id,
                  lat: vehicle.lat,
                  lon: vehicle.lon,
                  /*position: [vehicle.lat, vehicle.lon],*/
                  routeId: vehicle.routeId,
                  heading: arrowDirection,
                  secsSinceReport: locationAge,
                };

                arrowOptions.icon.fillOpacity = arrowOpacity;
                arrowOptions.icon.strokeOpacity = strokeOpacity;
                arrows[vehicle.id].setPosition(newPosition);
                arrows[vehicle.id].setIcon(arrowOptions.icon);
                /*arrows[vehicle.id].setOptions({
                  position: newPosition,
                  icon: arrowOptions.icon
                });*/             

                vehicleArrow = arrows[vehicle.id];

                google.maps.event.addListener(vehicleArrow, 'mouseover', (function(vehicleArrow, vehicle) {
                  return function() {
                    //Set info window details an create
                    infoWindow.setContent('<p><b>Route: </b> ' + vehicle.routeId + '</p><p><b>Vehicle ID:</b> ' + vehicle.id + '</p><b>Update :</b> ' + vehicle.secsSinceReport + '</p>');
                    infoWindow.setPosition(vehicleArrow.getPosition());
                    infoWindow.open(map);
                  };
                })(vehicleArrow, vehicle));

                //console.log('Existing Vehicle Changed: ', $scope.vehicles[vehicle.id]);
              } else {
                arrowOptions.icon.fillOpacity = arrowOpacity;
                arrowOptions.icon.strokeOpacity = strokeOpacity;
                arrows[vehicle.id].setIcon(arrowOptions.icon);

                vehicleArrow = arrows[vehicle.id];

                google.maps.event.addListener(vehicleArrow, 'mouseover', (function(vehicleArrow, vehicle) {
                  return function() {
                    //Set info window details an create
                    infoWindow.setContent('<p><b>Route: </b> ' + vehicle.routeId + '</p><p><b>Vehicle ID:</b> ' + vehicle.id + '</p><b>Update :</b> ' + vehicle.secsSinceReport + '</p>');
                    infoWindow.setPosition(vehicleArrow.getPosition());
                    infoWindow.open(map);
                  };
                })(vehicleArrow, vehicle));
              }
            }
          }

          finishTime = new Date();
          console.log(Object.keys($scope.vehicles).length, 'numNew: ', numNew, 'numChanged: ', numChanged, 'Finish Duration - ', finishTime - startTime, 'Calc Duration - ', finishTime - dataFinishTime);
        });
    });
  };

  
  $scope.getAllVehicles2();
  $interval($scope.getAllVehicles2, 3500);
});
