"use strict";

//TODO: encapsulate errthing
//TODO: add parameters to initMap() such that it can be called at a different location

var map;
var infowindow;
var markers = [];
var reviews = [];

function initMap() {
    var zoom = 13;
    var defaultLoc =    {
        // Chapel Hill, NC
        lat: 35.880,
        lng: -79.066
    }

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: zoom,
        center: defaultLoc
    });

    addPlaces(defaultLoc);
    
    // this works better than trying to load it all up in callbacks 
    (function wait() {
        if ( markers.length > 0 ) {
            bindKnockout();
        } else {
            setTimeout( wait, 100 );
        }
    })();
    
    /*
    TABLED until https

    var geoSuccess = function(position) {
        console.log('successful geolocation');
        var coords = {lat: position.coords.latitude, lng: position.coords.longitude};
        
        map = new google.maps.Map(document.getElementById('map'), {
            zoom: zoom,
            center: coords
        });
        
        addPlaces(coords, bindKnockout);
    }
    
    var geoFail = function(position)   {
        console.log('geolocation failed');
        var coords = {lat: position.coords.latitude, lng: position.coords.longitude};
        
        //build default map
        map = new google.maps.Map(document.getElementById('map'), {
            zoom: zoom,
            center: {lat: defaultLoc.lat, lng: defaultLoc.lng}
        });
        
        addPlaces(coords, bindKnockout);
    }
    
    //feature detection
    if(navigator.geolocation)    {
        navigator.geolocation.getCurrentPosition(geoSuccess, geoFail);
    }else   {
        //fallback
        geoFail();
    }*/
}

// TODO: correlate with http://developer.tmsapi.com/docs/data_v1_1/movies/Movie_showtimes API for showtimes

// hey look, callback hell.
function addPlaces(position)    {
    infowindow = new google.maps.InfoWindow();
    var service = new google.maps.places.PlacesService(map);
    
    service.nearbySearch({
        location: position,
        radius: 10000,
        type: ['movie_theater']
    }, callback);
    
    function callback(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            for (var i = 0; i < results.length; i++) {
                createMarker(results[i]);
            }
            // initiate knockout binding
        }else   {
            alert('Error: Could not load data from the Google Maps API');
        }
    };
    
    function createMarker(place) {
        var service = new google.maps.places.PlacesService(map);
        
        service.getDetails({
            placeId: place.place_id
        }, function(results, status){
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                var marker = new google.maps.Marker({
                    title: place.name,
                    map: map,
                    position: place.geometry.location,
                    animation: google.maps.Animation.DROP,
                    index: markers.length
                });

                marker.addListener('click', function() {
                    // add additional stuff here
                    infowindow.setContent(
                        '<strong>'+place.name+'</strong><br />'+
                        '<p class="address">'+results.formatted_address+'</p>'+
                        '<p>'+results.formatted_phone_number+'</p>'+
                        '<p><a target="_blank" href="'+results.url+'">View this location in Google Maps &#129141;</a></p>'
                    );
                    infowindow.open(map, this);
                    // marker bounces once when it's clicked
                    marker.setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(function(){ 
                        marker.setAnimation(null); 
                    }, 750);
                });

                markers.push(marker);
            }else   {
                alert('Error: Could not load data from the Google Places API');
            }
        });
    }
    
}

function loadReviews(callback)  {
    var url = "https://api.nytimes.com/svc/movies/v2/reviews/search.json";
    url += '?' + $.param({
      'api-key': "f0ba834b7431421e8971e70bda9a08bc"
    });
    $.ajax({
        url: url,
        method: 'GET',
    }).done(function(result) {
        reviews = result.results;
        callback();
    }).fail(function(err) {
        alert('Error: Could not load data from the New York Times API');
    });
}

function bindKnockout() {
    function viewModel() {
        var self = this;
        
        self.query = ko.observable('');
        
        self.focusMap = function(marker)    {
            map.panTo(marker.position);
            // triggers the code on the event listener created in createMarker()
            google.maps.event.trigger(marker, 'click');
        }
        
        //  TODO: Expand on this
        //  show more details about the review/star rating in a modal
        /*self.showReview = function(review)  {
            console.log(review.display_title);
        }*/
        
        self.markers = ko.dependentObservable(function() {
            var search = self.query().toLowerCase();
            return ko.utils.arrayFilter(markers, function(marker) {
                var bool = marker.title.toLowerCase().indexOf(search) >= 0;
                bool ? marker.setMap(map) : marker.setMap(null);
                return bool;
            });
        }, viewModel);
        
        self.reviews = ko.observableArray(reviews);
    }
    
    function callback() {
        ko.applyBindings(new viewModel());
    }
    
    loadReviews(callback);
}

