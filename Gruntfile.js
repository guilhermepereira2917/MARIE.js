'use strict';

module.exports = function(grunt) {
    grunt.initConfig({
        open: {
            dev: {
                path: 'index.html'
            }
        },
        jshint: {
            files: ['js/*.js', 'Gruntfile.js']
        },
        pkg: grunt.file.readJSON('package.json')
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-open');

    grunt.registerTask('build', []);
    grunt.registerTask('run', ['open:dev']);
    grunt.registerTask('bar', ['build', 'run']);
    grunt.registerTask('default', ['bar']);
};
