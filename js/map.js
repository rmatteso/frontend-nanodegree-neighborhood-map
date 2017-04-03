"use strict";

//TODO: encapsulate errthing
//TODO: add parameters to initMap() such that it can be called at a different location

var map;
var infowindow;
var markers = [];

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

    addPlaces(defaultLoc, bindKnockout);
};

// hey look, callback hell.
function addPlaces(position, bind)    {
    infowindow = new google.maps.InfoWindow();
    var service = new google.maps.places.PlacesService(map);
    
    service.nearbySearch({
        location: position,
        radius: 10000,
        type: ['movie_theater']
    }, callback);
    
    function callback(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            // this is required to make sure that the knockout items aren't bound until all the asynchronous requests have completed
            async.eachOf(results, function(value, key, callback)  {
                createMarker(value, callback);
            }, function(err)   {
                if(err) {
                    console.log('Something broke.');
                    console.log(err);
                }
                bindKnockout();
            });
 
        }else   {
            alert('Error: Could not load data from the Google Maps API');
        };
    };
    
    function createMarker(place, callback) {
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
                markers.push(marker);
                
                getFoursquare(place.name, function(results)   {
                    //console.log(results);
                    
                    // could actually strip out details seach.. 4square has a formatted address too.
                    
                    // let's do some stuff with the foursquare results.
                    // it has social info like twitter and FB 
                    // if 4square name == place name.. else say we couldn't find a good match.
                    
                    var content = '<strong>'+place.name+'</strong><br />';
                    
                    if(results.name == place.name)  {
                        var url = '';
                            if(results.url)  {
                                url = results.url;
                            }else   {
                                url = 'no Foursquare info available';
                            }

                        content +=
                            '<p class="address">'+details.formatted_address+'</p>'+
                            '<p>'+details.formatted_phone_number+'</p>'+
                            '<p><a target="_blank" href="'+url+'">'+place.name+'</a></p>'+
                            '<p><a target="_blank" href="'+details.url+'">View this location in Google Maps &#129141;</a></p>';
                        
                        
                    }else   {
                        content += 'We couldn\'t retrieve any information for this location';
                        console.log('results name: ' + results.name);
                        console.log('place name: ' + place.name);
                    }
    
                    marker.addListener('click', function() {
                        // add additional stuff here
                        infowindow.setContent(content);
                        infowindow.open(map, this);
                        // marker bounces once when it's clicked
                        marker.setAnimation(google.maps.Animation.BOUNCE);
                        setTimeout(function(){ 
                            marker.setAnimation(null); 
                        }, 700);
                    });
                    // this tells the async call to that we've created the marker
                    callback();
                });
            }else   {
                alert('Error: Could not load data from the Google Places API');
            };  
        });
    };  
};

function bindKnockout() {
    function viewModel() {
        var self = this;
        
        self.query = ko.observable('');
        
        self.focusMap = function(marker)    {
            map.panTo(marker.position);
            // triggers the code on the event listener created in createMarker()
            google.maps.event.trigger(marker, 'click');
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