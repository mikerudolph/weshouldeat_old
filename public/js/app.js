define([
    'jquery',
    'underscore',
    'backbone',
    'bootstrap',
    'router',
], function($, _, Backbone, Bootstrap, Router){

    var initialize = function() {
        Router.initialize();
    };

    return {
        initialize: initialize
    };
});