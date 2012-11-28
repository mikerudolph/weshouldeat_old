define([
    'jquery',
    'underscore',
    'backbone',
    'bootstrap',
    'text!templates/front/appHome.html',
    'text!templates/top/header.html',
], function($, _, Backbone, Bootstrap, appMainTemplate, headerTemplate){

    var view = Backbone.View.extend({
        el: $('#container-fluid'),

        render: function() {
            this.$el.append('<div id="header">'); // create header div
            this.$el.append('<div id="main-content">'); // create content div
            $('#header').html(headerTemplate); // insert header
            $('#main-content').html(appMainTemplate); // insert content
        }
    });

    return view;

});