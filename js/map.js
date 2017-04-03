var app = (function() {
    "use strict";

    var map,
        infowindow,
        markers = [],
        defaultLoc = {
            // Chapel Hill, NC
            lat: 35.88,
            lng: -79.066
        };

    function initMap() {
        var zoom = 13;

        map = new google.maps.Map(document.getElementById('map'), {
            zoom: zoom,
            center: defaultLoc
        });

        addPlaces(defaultLoc, bindKnockout);
    }

    function apiError() {
        alert('I\'m afraid I can\'t let you do that, Dave');
    }

    function addPlaces(position, bind) {
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
                async.eachOf(results, function(value, key, callback) {
                    createMarker(value, callback);
                }, function(err) {
                    if (err) {
                        console.log('Something broke.');
                        console.log(err);
                    }
                    bindKnockout();
                });

            } else {
                alert('Error: Could not load data from the Google Maps API');
            }
        }

        function createMarker(place, callback) {
            // could strip out details seach.. 4square has a formatted address too.. the drawback being if it's not a good match, you don't have an address at all.

            var service = new google.maps.places.PlacesService(map);

            service.getDetails({
                placeId: place.place_id
            }, function(results, status) {
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

                    getFoursquare(place.name, function(results) {

                        // we don't want to exclude results because of slight differences
                        // such as 'The Lumina' vs 'Lumina Theatre' which !==
                        function samePlace(a, b) {
                            var c = FuzzySet();
                            c.add(a);
                            var sim = c.get(b)[0][0];

                            if (sim >= 0.8) {
                                return true;
                            } else {
                                var splitA = a.split(' ');
                                var splitB = b.split(' ');

                                for (var i = 0; i < splitA.length; i++) {
                                    for (var j = 0; j < splitB.length; j++) {
                                        if (splitA[i] == splitB[j]) {
                                            return true;
                                        } else {
                                            var c = FuzzySet();
                                            c.add(splitA[i]);
                                            var sim = c.get(splitB[j][0][0]);

                                            if (sim >= 0.8) {
                                                return true;
                                            }
                                        }
                                    }
                                }
                                console.log(sim);
                                return false;
                            }
                        }

                        var content = [];

                        content.push('<p><strong><a title="View this location in Google Maps" target="_blank" href="' + details.url + '">' + place.name + ' &#129141;</a></strong></p>');
                        content.push('<p class="address">' + details.formatted_address + '</p>');
                        content.push('<p>' + details.formatted_phone_number + '</p>');
                        
                        // basically if we have the right response from 4sq
                        if (samePlace(place.name, results.name)) {
                            content.push('<h2>Foursquare API information</h2>');
                            
                            console.log(results);
                            
                            content.push('<p><a target="_blank" href="https://foursquare.com/venue/'+results.id+'"?ref=WZKW3MYVINNZ1GTUSAUTNCM5CL3LRTHYQ2FQOFOYUQKVOA02">Foursquare Venue Page</a></p>')
                            
                            // check for undefined
                            if (results.url) {
                                content.push('<p>Website: <a target="_blank" href="' + results.url + '">' + place.name + '</a></p>');
                            }else   {
                                content.push('<p>no website provided</p>');
                            }

                            // here's where more foursquare information would go


                            content.push('<p><img id="four_logo" src="img/foursquare-300.png" alt="powered by foursquare"></p>');
                        } else {
                            content.push('<p>We couldn\'t retrieve any Foursquare information for this location</p>');
                        }

                        content = content.join('');

                        marker.addListener('click', function() {
                            // add additional stuff here
                            infowindow.setContent(content);
                            infowindow.open(map, this);
                            // marker bounces once when it's clicked
                            marker.setAnimation(google.maps.Animation.BOUNCE);
                            setTimeout(function() {
                                marker.setAnimation(null);
                            }, 700);
                        });
                        // this tells the async call to that we've created the marker
                        callback();
                    });
                } else {
                    alert('Error: Could not load data from the Google Places API');
                };
            });
        };
    }

    function bindKnockout() {
        function viewModel() {
            var self = this;

            self.query = ko.observable('');

            self.focusMap = function(marker) {
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
    }

    function getFoursquare(query, callback) {
        var cID = 'WZKW3MYVINNZ1GTUSAUTNCM5CL3LRTHYQ2FQOFOYUQKVOA02';
        var cSec = 'VNPODPWJ4YA0ICU4J3JMP3SSZCBRVQ4OZ4ARXMM52ONFUSR5';
        var baseURL = 'https://api.foursquare.com/v2/venues/search?';
        var version = '20170321';

        //var parameters = 'll=40.7,-74';
        var query = query;
        var parameters = 'query=' + query + '&ll=' + defaultLoc.lat.toFixed(2) + ',' + defaultLoc.lng.toFixed(2);

        var call = baseURL +
            '&' + parameters +
            '&client_id=' + cID +
            '&client_secret=' + cSec +
            '&v=' + version;

        $.get(call)
            .done(function(results) {
                if (results.response.venues.length > 0) {
                    callback(results.response.venues[0]);
                }
            })
            .fail(function(err) {
                alert('We were unable to retrieve any information from the Foursquare API');
                console.log('foursquare API call failed');
                console.log(err);
            });
    };

    return {
        "initMap": initMap,
        "apiError": apiError
    }
})();