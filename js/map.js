"use strict";

//TODO: encapsulate errthing
//TODO: add parameters to initMap() such that it can be called at a different location

var map;
var infowindow;
var markers = [];
var reviews = [];

var defaultLoc =    {
    // Chapel Hill, NC
    lat: 35.88,
    lng: -79.066
}

function initMap() {
    var zoom = 13;

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: zoom,
        center: defaultLoc
    });

    addPlaces(defaultLoc);
    
    (function wait() {
        if ( markers.length > 0 ) {
            bindKnockout();
        } else {
            setTimeout( wait, 100 );
        }
    })();
};

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
            var details = results;
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                var marker = new google.maps.Marker({
                    title: place.name,
                    map: map,
                    position: place.geometry.location,
                    animation: google.maps.Animation.DROP,
                    index: markers.length
                });
                
                getFoursquare(place.name, function(results)   {
                    console.log('foursquare callback results');
                    console.log(results);
                    marker.addListener('click', function() {
                        // add additional stuff here
                        infowindow.setContent(
                            '<strong>'+place.name+'</strong><br />'+
                            '<p class="address">'+details.formatted_address+'</p>'+
                            '<p>'+details.formatted_phone_number+'</p>'+
                            '<p><a target="_blank" href="'+details.url+'">View this location in Google Maps &#129141;</a></p>'
                        );
                        infowindow.open(map, this);
                        // marker bounces once when it's clicked
                        marker.setAnimation(google.maps.Animation.BOUNCE);
                        setTimeout(function(){ 
                            marker.setAnimation(null); 
                        }, 700);
                    });
                });  

                markers.push(marker);
            }else   {
                alert('Error: Could not load data from the Google Places API');
            }
        });
    }
    
};

/*
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
};*/

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
        
        //self.reviews = ko.observableArray(reviews);
    }
    
    function callback() {
        ko.applyBindings(new viewModel());
    }
    
    //loadReviews(callback);
    callback();
};

function getFoursquare(query, callback)  {
    var cID = 'WZKW3MYVINNZ1GTUSAUTNCM5CL3LRTHYQ2FQOFOYUQKVOA02';
    var cSec = 'VNPODPWJ4YA0ICU4J3JMP3SSZCBRVQ4OZ4ARXMM52ONFUSR5';
    var baseURL = 'https://api.foursquare.com/v2/venues/search?';
    var version = '20170321';
    
    //var parameters = 'll=40.7,-74';
    var query = query;
    var parameters = 'query=' + query + '&ll=' + defaultLoc.lat.toFixed(2) + ',' + defaultLoc.lng.toFixed(2);
    
    var call = baseURL 
        + '&' + parameters 
        + '&client_id=' + cID
        + '&client_secret=' + cSec
        + '&v=' + version;
    
    $.get(call)
        .done(function(results)    {
            if(results.response.venues.length > 0)      {
                callback(results.response.venues[0]);
            }
        })
        .fail(function(err)  {
            console.log('foursquare API call failed');
            console.log(err);
        });
};