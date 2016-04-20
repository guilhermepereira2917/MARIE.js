'use strict';

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        open: {
            dev: {
                path: 'build/index.html'
            }
        },
        ejs: {
            all: {
                options: {
                    version: "<%= pkg.version %>"
                },
                expand: true,
                cwd: 'src/templates/',
                src: ['*.ejs'],
                dest: 'build/',
                ext:  '.html'
                
            }
        },
        copy: {
            main: {
                expand: true,
                cwd: 'src/',
                src: ['**/*', '!**/templates/**'],
                dest: 'build/'
            }
        },
        jshint: {
            files: ['js/*.js', 'Gruntfile.js']
        },
        clean: ['build']
    });

    grunt.loadNpmTasks('grunt-open');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-ejs');

    grunt.registerTask('build', ['clean', 'ejs', 'copy']);
    grunt.registerTask('run', ['open:dev']);
    grunt.registerTask('bar', ['build', 'run']);
    grunt.registerTask('default', ['bar']);
};
