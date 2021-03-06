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

  var startTime;
  var dataFinishTime;
  var finishTime;

  //Get bounds of map
  var mapBounds = null;
  var edge = {
      north: null, // LatLng of the north-east corner
      east: null, // LatLng of the north-east corner
      south: null, // LatLng of the north-east corner
      west: null // LatLng of the north-east corner
    };
  var latBuffer = null;
  var lngBuffer = null;
  var bounds = {
    north: null,
    east: null,
    south: null,
    west: null
  };

  var vehicleData = null;

  var circleOptions = {
    radius: 18,
    clickable: true,
    fillColor: '#008900',
    strokeColor: '#CC0000',
    strokeWeight: 2
  };

  var animationDuration = 3000;
  var arrowOptions = {
    icon: {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 3,
      fillColor: '#008900',
      strokeColor: '#CC0000',
      strokeWeight: 1,
    },
    duration: animationDuration,
    easing: 'easeInSine'
  };

  var infoWindowOptions = {
    /*disableAutoPan: false,*/
    maxWidth: 85
  };

  var infoWindow = new google.maps.InfoWindow(infoWindowOptions);

  var getBorder = function(map){
    //get visible map bounds
    mapBounds = map.getBounds();
    edge.north = mapBounds.getNorthEast().lat(); // LatLng of the north-east corner
    edge.east = mapBounds.getNorthEast().lng(); // LatLng of the north-east corner
    edge.south = mapBounds.getSouthWest().lat(); // LatLng of the north-east corner
    edge.west = mapBounds.getSouthWest().lng(); // LatLng of the north-east corner
    //console.log(edge.north, edge.east, edge.south, edge.west);
    latBuffer = Math.abs(edge.north - edge.south)/3;
    lngBuffer = Math.abs(edge.east - edge.west)/3;
    bounds.north = edge.north + latBuffer;
    bounds.east = edge.east + lngBuffer;
    bounds.south = edge.south - latBuffer;
    bounds.west = edge.west - lngBuffer;
  };

  $scope.getAllVehicles = function(){
    //$http.get('http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=ttc&t=0')
    startTime = new Date();
    console.log('start');

    NgMap.getMap().then(function(map) {
      //set the map where the circles are to be rendered
      circleOptions.map = map;

      getBorder(map);

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



  var updateVehiclesOnMap = function(data, isRefresh){
    var numNew = 0;
    var numChanged = 0;

    for(var i=0; i < data.length; i++) {
      var vehicle = data[i];

      var newPosition = new google.maps.LatLng(parseFloat(vehicle.lat), parseFloat(vehicle.lon));

      if(newPosition.lat() < bounds.north && newPosition.lat() > bounds.south && newPosition.lng() < bounds.east && newPosition.lng() > bounds.west){
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
        arrowOptions.title = 'Route: ' + vehicle.routeId + '\nVehicle ID: ' + vehicle.id + '\nUpdate: ' + vehicle.secsSinceReport;

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
          //arrows[vehicle.id] = new google.maps.Marker(arrowOptions);
          arrows[vehicle.id] = new SlidingMarker(arrowOptions);
          vehicleArrow = arrows[vehicle.id];
          //arrows[vehicle.id].setMap(map);

          google.maps.event.addListener(vehicleArrow, 'click', (function(vehicleArrow, vehicle) {
            return function() {
              //Set info window details an create
              infoWindow.setContent('<p><b>Route: </b> ' + vehicle.routeId + '</p><p><b>Vehicle ID:</b> ' + vehicle.id + '</p><b>Update :</b> ' + vehicle.secsSinceReport + '</p>');
              infoWindow.setPosition(vehicleArrow.getPosition());
              infoWindow.open(vehicleArrow.map);
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
            arrows[vehicle.id].setIcon(arrowOptions.icon);
            arrows[vehicle.id].setTitle(arrowOptions.title);
            if (isRefresh){
              arrows[vehicle.id].setDuration(10);
              arrows[vehicle.id].setPosition(newPosition);
              arrows[vehicle.id].setDuration(animationDuration);
            }else{
              arrows[vehicle.id].setPosition(newPosition);
            }
            /*arrows[vehicle.id].setOptions({
              position: newPosition,
              icon: arrowOptions.icon
            });*/             

            vehicleArrow = arrows[vehicle.id];

            google.maps.event.addListener(vehicleArrow, 'click', (function(vehicleArrow, vehicle) {
              return function() {
                //Set info window details an create
                infoWindow.setContent('<p><b>Route: </b> ' + vehicle.routeId + '</p><p><b>Vehicle ID:</b> ' + vehicle.id + '</p><b>Update :</b> ' + vehicle.secsSinceReport + '</p>');
                infoWindow.setPosition(vehicleArrow.getPosition());
                infoWindow.open(vehicleArrow.map);
              };
            })(vehicleArrow, vehicle));

            //console.log('Existing Vehicle Changed: ', $scope.vehicles[vehicle.id]);
          } else {
            arrowOptions.icon.fillOpacity = arrowOpacity;
            arrowOptions.icon.strokeOpacity = strokeOpacity;
            arrows[vehicle.id].setIcon(arrowOptions.icon);
            arrows[vehicle.id].setTitle(arrowOptions.title);

            vehicleArrow = arrows[vehicle.id];

            google.maps.event.addListener(vehicleArrow, 'click', (function(vehicleArrow, vehicle) {
              return function() {
                //Set info window details an create
                infoWindow.setContent('<p><b>Route: </b> ' + vehicle.routeId + '</p><p><b>Vehicle ID:</b> ' + vehicle.id + '</p><b>Update :</b> ' + vehicle.secsSinceReport + '</p>');
                infoWindow.setPosition(vehicleArrow.getPosition());
                infoWindow.open(vehicleArrow.map);
              };
            })(vehicleArrow, vehicle));
          }
        }
      }
    }

    finishTime = new Date();
    console.log(Object.keys($scope.vehicles).length, 'numNew: ', numNew, 'numChanged: ', numChanged, 'Finish Duration - ', finishTime - startTime, 'Calc Duration - ', finishTime - dataFinishTime);
  };

  $scope.getAllVehicles2 = function(){
    //$http.get('http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=ttc&t=0')
    startTime = new Date();
    console.log('start');

    NgMap.getMap().then(function(map) {
      //set the map where the circles are to be rendered
      arrowOptions.map = map;

      getBorder(map);

      $http.get('http://restbus.info/api/agencies/ttc/vehicles')
        .success(function(data){
          dataFinishTime = new Date();
          vehicleData = data;
          console.log('data returned - ', dataFinishTime - startTime);

          updateVehiclesOnMap(vehicleData, false);
          
        });
    });
  };

  $scope.vehicleRefresh = function(){
    if(arrowOptions.map && vehicleData){
      startTime = new Date();
      console.log('refresh start');

      getBorder(arrowOptions.map);

      //if(edge.north < bounds.north && edge.south > bounds.south && edge.east < bounds.east && edge.west > bounds.west){
        dataFinishTime = new Date();
        console.log('data returned - ', dataFinishTime - startTime);

        updateVehiclesOnMap(vehicleData, true);
      //}
    }
  };
  
  $scope.getAllVehicles2();
  $interval($scope.getAllVehicles2, animationDuration+250);
});
