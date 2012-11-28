define([
    'jquery',
    'underscore',
    'backbone',
    'bootstrap',
    'text!templates/front/loginView.html'
], function($, _, Backbone, Bootstrap, loginTemplate){

    var view = Backbone.View.extend({
        el: $('#container-fluid'),

        render: function() {
            this.$el.html(loginTemplate);
        }
    });

    return view;

});