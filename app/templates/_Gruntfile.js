/**
 *
 */
var path = require('path');

function getGlobalNpmTaskPath() {
    return '<%= globalNpmTaskPath %>';
}

module.exports = function(grunt) {
    require('findup-grunt-npmtasks')(grunt);

    grunt.initConfig({
        transport: {
        }
    });

    grunt.file.setBase(getGlobalNpmTaskPath());
    grunt.loadNpmTasks('grunt-cmd-transport');
    grunt.loadNpmTasks('grunt-cmd-concat');
    grunt.file.setBase(__dirname);
}
