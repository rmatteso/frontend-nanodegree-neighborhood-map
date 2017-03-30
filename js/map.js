"use strict";

var map;
var infowindow;
var markers = [];

function initMap() {
    var zoom = 13;
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
        }
    };
    
    function createMarker(place) {
        var service = new google.maps.places.PlacesService(map);
        
        service.getDetails({
            placeId: place.place_id
        }, function(results, status){
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
                    '<strong>'+place.name+'</strong><br />'+
                    //'<span>'+place.place_id+'</span>'
                    '<span>'+results.formatted_address+'</span><br />'+
                    '<span>'+results.formatted_phone_number+'</span>'
                );

                infowindow.open(map, this);
                console.log('what?');
            });

            markers.push(marker);
        });
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

// NYT API
//
// Key: f0ba834b7431421e8971e70bda9a08bc

function getNYT()   {
    var url = "https://api.nytimes.com/svc/movies/v2/reviews/search.json";
    url += '?' + $.param({
      'api-key': "f0ba834b7431421e8971e70bda9a08bc"
    });
    $.ajax({
        url: url,
        method: 'GET',
    }).done(function(result) {
        console.log(result);
    }).fail(function(err) {
        throw err;
    });
};

// YELP FUSION API
//
// App Id: ce9jQ8AOQ8_YI_oLw-holQ
// App Secret: q6fEh4OFhrDXiXniITHAhoABFf6uVkud3LytSs3ywjSaMtvel2raOT2JkcBZ5qyg

/*
var oauth = OAuth({
    consumer: {
        key: 'PypE7f5VMTQ-n2mdSHSvVQ',
        secret: 'RaX8bj02RpHrNBb_ymfW3BuBt5M'
    },
    signature_method: 'HMAC-SHA1',
    hash_function: function(base_string, key) {
        return CryptoJS.HmacSHA1(base_string, key).toString(CryptoJS.enc.Base64);
    }
});

var request_data = {
    url: 'https://api.yelp.com/v2/search?term=food&location=San+Francisco&format=jsonp?callback=?',
    method: 'GET'
};

var token = {
    key: '2hCEZOnNqQl_GCXP2YuprTQp3syrsT8_',
    secret: 'AhYqgFgxLHTQxejxD2wud1UEFkk'
};

$.ajax({
    url: request_data.url,
    type: request_data.method,
    data: oauth.authorize(request_data, token),
    dataType: 'jsonp',
    cache: true,
    success: function(data) {
        console.log('success');
    },
    error: function(data) {
        console.log(data);
    }
});

*/
/*

//  YELP API v2.0
//  Consumer Key	PypE7f5VMTQ-n2mdSHSvVQ
//  Consumer Secret	RaX8bj02RpHrNBb_ymfW3BuBt5M
//  Token	2hCEZOnNqQl_GCXP2YuprTQp3syrsT8_
//  Token Secret	AhYqgFgxLHTQxejxD2wud1UEFkk

var oauth = OAuth({
    consumer: {
        key: 'PypE7f5VMTQ-n2mdSHSvVQ',
        secret: 'RaX8bj02RpHrNBb_ymfW3BuBt5M'
    },
    signature_method: 'HMAC-SHA1',
    hash_function: function(base_string, key) {
        return CryptoJS.HmacSHA1(base_string, key).toString(CryptoJS.enc.Base64);
    }
});

var request_data = {
    url: 'https://api.yelp.com/v2/search?term=food&location=San+Francisco&format=jsonp?callback=?',
    method: 'GET'
};

var token = {
    key: '2hCEZOnNqQl_GCXP2YuprTQp3syrsT8_',
    secret: 'AhYqgFgxLHTQxejxD2wud1UEFkk'
};

$.ajax({
    url: request_data.url,
    type: request_data.method,
    data: oauth.authorize(request_data, token),
    dataType: 'jsonp',
    cache: true,
    success: function(data) {
        console.log('success');
    },
    error: function(data) {
        console.log(data);
    }
});

*/

/*

Flickr info

udacity-neighborhood-project
Key:
12a0460908d2427cf12de4bf92e9bc5f

Secret:
876228c59af5be4d

$.get('https://api.flickr.com/services/rest/?&method=flickr.people.getPublicPhotos&format=json&api_key=6f93d9bd5fef5831ec592f0b527fdeff&user_id=9395899@N08')

var url = 'https://api.flickr.com/services/rest/?';
var method = 'flickr.people.getPublicPhotos';

var parameters = [];
parameters.push('format=json');
parameters.push('api_key=12a0460908d2427cf12de4bf92e9bc5f');
parameters.push('user_id=876228c59af5be4d');
parameters.join('');

var request = url+method+parameters.join('');

*/
