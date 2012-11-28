/*  Setup front-end dependencies
    for backbone.js
*/

require.config({
    paths: {
        jquery:     'libs/jquery-min',
        underscore: 'libs/underscore-min',
        backbone:   'libs/backbone-min',
        text:       'libs/text',
        bootstrap:  'libs/bootstrap',
        templates:  '../templates'
    }
});

require([
    'app',
], function(App) {
    App.initialize();
});