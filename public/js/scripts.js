//$(document).ready(function() {
    /*  Quick hacking to get current room on
        client side incase user hits url directly */
    var url      = document.URL,
        app_root = 'http://localhost/';
        socket = io.connect('http://localhost:80');

    if ( url.indexOf('/#/') ) {
        var split = url.split('/#/');
        currentRoom = split[1];

        $.get(app_root + 'api/auth/current/', function(user) {
            socket.emit('joinRoom', currentRoom, user);
        });
    }

    /* socket.io functions */
    /*socket.on('listrooms', function(rooms) {
        if ( rooms.length  ) {
            var el = $('#room-listing ul');
                el.empty();

            for ( var i=0; i<rooms.length; i++) {
                el.append(
                    '<li class="join-room">'+
                        '<a href="/#/' + rooms[i] + '">' + rooms[i] + '</a>'+
                    '</li>'
                );
            }
        }
    });*/

    /*socket.on('updateActions', function(action) {
        var el = $('.activity-inner ul');
        
        $.get(app_root + 'api/auth/current/', function(user) {
            /* Check user bg color incase its dark for white text
            var colorIs = lightOrDark(user['background_color']);
            var textColor = '';

            if ( colorIs === 'dark' ) {
                textColor = '#fff';
            }

            var li = '<li style="background:#' + user['background_color'] + '; color:' + textColor + '">' + action + '</li>';
            el.prepend(li);
        });
    });*/

    /*socket.on('sendSuggestion', function(suggestion) {
        var el = $('.suggestions-list .thumbnails');
        var li = '<li class="span4" data-suggest-name="'+ suggestion['name'] +'" data-lng="'+ suggestion['lng'] +'" data-lat="'+ suggestion['lat'] +'">'+
                        '<div class="thumbnail">'+
                            '<div class="caption">'+
                                '<h3>'+ suggestion['name'] +'</h3>'+
                                '<p>This place was suggested by '+ suggestion['real_name'] +'</p>'+
                                '<p><button class="place-vote btn btn-primary" data-vote-name="'+ suggestion['name'] +'">Vote for this!</button></p>'+
                            '</div>'+
                        '</div>'+
                    '</li>';
        el.prepend(li);

        // Might seem hacky to use unbind, only solution for way bringing suggestions in though :)
        $('.place-vote').unbind('click').click(function() {
            var place = $(this).attr('data-vote-name');
            $.get(app_root + 'api/auth/current/', function(user) {
                socket.emit('voteSent', currentRoom, place, user);
            });
        });
    });*/

    /* General JS functions */

    // Upon entering room/workplace, press enter to submit
    /*$('#workplaceInput').keyup(function(e) {
        console.log('hello');
        if (e.keyCode == 13) {
            socket.emit('addRoom', $(this).val());
            window.location = 'http://localhost/#/' + $(this).val();
        }
    });*/

/*    $('#suggest-btn').click(function() {
        $('#suggest-modal').modal();
    });*/


    /* Google Maps API */
    var gmapInit = function() {
        var mapOptions  = { zoom: 16, mapTypeId: google.maps.MapTypeId.ROADMAP },
        map             = new google.maps.Map(document.getElementById('map_canvas'), mapOptions),
        input           = document.getElementById('autoCompleteTest'),
        autocomplete    = new google.maps.places.Autocomplete(input),
        infowindow      = new google.maps.InfoWindow(),
        marker          = new google.maps.Marker({ map: map });

        autocomplete.bindTo('bounds', map);

        google.maps.event.addListener(autocomplete, 'place_changed', function() {
            var place = autocomplete.getPlace();
                map.setZoom(16);

            $.get(app_root + 'api/auth/current/', function(user) {
                var lat = place.geometry.location.lat(),
                    lng = place.geometry.location.lng(),
                    placeObject = {
                        uid: user['uid'],
                        lat: lat.toString(),
                        lng: lng.toString(),
                        name: place.name
                    }
                    socket.emit('placeSuggested', placeObject, currentRoom);
            });
            $('#suggest-modal').modal('hide');
        });

        socket.on('updateMostVoted', function(mostVoted) {
            var placeName = mostVoted[0],
                placeDiv  = $('li[data-suggest-name="'+ placeName +'"]'),
                lat       = placeDiv.attr('data-lat'),
                lng       = placeDiv.attr('data-lng');

            if ( typeof placeName === 'undefined' ) {
                if ( navigator.geolocation ) {
                    navigator.geolocation.getCurrentPosition(function(success, error) {
                        var lat = success.coords.latitude,
                            lng = success.coords.longitude;

                        marker.setPosition(new google.maps.LatLng(lat, lng));
                        map.setCenter(new google.maps.LatLng(lat,lng), 16);
                    });
                } else {
                    var lat = 44.64886,
                        lng = -63.57532;
                    marker.setPosition(new google.maps.LatLng(lat, lng));
                    map.setCenter(new google.maps.LatLng(lat,lng), 16);
                }
            } else {
                marker.setPosition(new google.maps.LatLng(lat, lng));
                map.setCenter(new google.maps.LatLng(lat,lng), 16);  
            }
        });
    }
    
    //Note: this code is based off jQuery plugin here: https://gist.github.com/1636338
    var lightOrDark = function(color) {
        var r, b, g, hsp, a = color;

        if (a.match(/^rgb/)) {
            a = a.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
            r = a[1];
            b = a[2];
            g = a[3];
        } else {
            a = +("0x" + a.slice(1).replace( // thanks to jed : http://gist.github.com/983661
            a.length < 5 && /./g, '$&$&'));
            r = a >> 16;
            b = a >> 8 & 255;
            g = a & 255;
        }

        hsp = Math.sqrt( // HSP equation from http://alienryderflex.com/hsp.html
            0.299 * (r * r) +
            0.587 * (g * g) +
            0.114 * (b * b)
        );

        if (hsp>127.5) {
            return 'light';
        } else {
            return 'dark';
        }
    }
//});