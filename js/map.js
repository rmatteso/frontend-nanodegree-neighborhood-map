"use strict";

var map;
var infowindow;
var markers = [];

function initMap() {
    var zoom = 16;
    var defaultLoc =    {
        // Chapel Hill, NC
        lat: 35.880,
        lng: -79.066
    }
    
    var geoSuccess = function(position) {
        console.log('successful geolocation');
        
        map = new google.maps.Map(document.getElementById('map'), {
            zoom: zoom,
            center: {lat: position.coords.latitude, lng: position.coords.longitude}
        });
        
        addPlaces({lat: position.coords.latitude, lng: position.coords.longitude});
    }
    
    var geoFail = function()   {
        console.log('geolocation failed');
        
        //build default map
        map = new google.maps.Map(document.getElementById('map'), {
            zoom: zoom,
            center: {lat: defaultLoc.lat, lng: defaultLoc.lng}
        }); 
    }
    
    //feature detection
    if(navigator.geolocation)    {
        navigator.geolocation.getCurrentPosition(geoSuccess, geoFail);
    }else   {
        //fallback
        geoFail();
    }
    
    // for some reason, callbacks weren't working to make sure this had loaded properly... i think the places service call is the issue.
    (function wait() {
        if ( markers.length > 0 ) {
            bindKnockout();
        } else {
            setTimeout( wait, 100 );
        }
    })();
    
}

function addPlaces(position)    {
    infowindow = new google.maps.InfoWindow();
    var service = new google.maps.places.PlacesService(map);
    
    service.nearbySearch({
        location: position,
        radius: 500,
        type: ['restaurant']
    }, callback);
    
    function callback(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            for (var i = 0; i < results.length; i++) {
                createMarker(results[i]);
            }
        }
    }
    
    function createMarker(place) {
        var placeLoc = place.geometry.location;
        var marker = new google.maps.Marker({
            title: place.name,
            map: map,
            position: place.geometry.location,
            animation: google.maps.Animation.DROP,
            index: markers.length, // hopefully this will help with the show/hide
        });

        marker.addListener('click', function() {
            // add additional stuff here
            infowindow.setContent(
                place.name
            );
            
            infowindow.open(map, this);
        });

        markers.push(marker);
    }
}

function bindKnockout() {
    function viewModel() {
        var self = this;
        
        self.query = ko.observable('');
        
        self.focusMap = function(marker)    {
            map.setCenter(marker.position);
        }
        
        self.markers = ko.dependentObservable(function() {
            var search = self.query().toLowerCase();
            return ko.utils.arrayFilter(markers, function(marker) {
                var bool = marker.title.toLowerCase().indexOf(search) >= 0;
                bool ? marker.setMap(map) : marker.setMap(null);
                return bool;
            });
        }, viewModel);
    }

    ko.applyBindings(new viewModel());
}
