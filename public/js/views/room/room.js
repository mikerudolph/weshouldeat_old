define([
    'jquery',
    'underscore',
    'backbone',
    'bootstrap',
    'text!templates/room/room.html',
    'text!templates/top/header.html',
], function($, _, Backbone, Bootstrap, appRoomTemplate, headerTemplate){

    var view = Backbone.View.extend({
        el: $('#container-fluid'),

        render: function() {
            //this.$el.append('<div id="header">'); // create header div
            //this.$el.append('<div id="main-content">'); // create content div
            $('#header').html(headerTemplate); // insert header
            $('#main-content').html(appRoomTemplate); // insert content
        }
    });

    return view;

});