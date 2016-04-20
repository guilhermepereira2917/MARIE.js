'use strict';

module.exports = function(grunt) {
    grunt.initConfig({
        open: {
            dev: {
                path: 'build/index.html'
            }
        },
        copy: {
            main: {
                expand: true,
                cwd: 'src/',
                src: ['**'],
                dest: 'build/'
            }
        },
        jshint: {
            files: ['js/*.js', 'Gruntfile.js']
        },
        clean: ['build'],
        pkg: grunt.file.readJSON('package.json')
    });

    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('build', ['clean', 'copy']);
    grunt.registerTask('run', ['open:dev']);
    grunt.registerTask('bar', ['build', 'run']);
    grunt.registerTask('default', ['bar']);
};
