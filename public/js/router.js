define([
    'jquery',
    'underscore',
    'backbone',
    'bootstrap',
    'views/front/loginView',
    'views/front/appHome',
    'views/room/room'
], function($, _, Backbone, Bootstrap, loginView, appHomeView, appRoomView){

    // Setup front-end router
    var AppRouter = Backbone.Router.extend({
        routes: {
            // Join a room/session
            ':room': 'joinRoom',

            // Default action route
            '': 'default',
        }
    });

    var initialize = function() {
        var router = new AppRouter;

        router.on('route:default', function(actions) {
            var login   = new loginView(),
                appHome = new appHomeView();

            $.get('http://weshouldeat.com/api/auth/check', function(data) {
                if ( data === 'true' ) { // TODO: convert this away from a string into boolean
                    appHome.render();
                } else {
                    login.render();
                }
            });

        });

        router.on('route:joinRoom', function() {
            var view = new appRoomView();

            view.render();
        });

        Backbone.history.start();
    };

    return {
        initialize: initialize
    };

});