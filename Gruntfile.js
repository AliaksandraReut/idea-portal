'use strict';

module.exports = function (grunt) {
    var config = {
        app: './',
        dist: 'dist'
    };

    try {
        config.app = require('./bower.json').appPath || config.app;
    } catch (e) {
    }

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-ngmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.initConfig({
        config: config,
        watch: {
            options: {
                livereload: true
            },
            scripts: {
                files: ['scripts/{,**/}*.js'],
                tasks: ['ngmin:build']
            },
            css: {
                files: ['styles/css/*.css'],
                tasks: ['copy:css']
            }
        },
        ngmin: {
            build: {
                expand: true,
                cwd: './scripts/',
                src: '{,**/}*.js',
                dest: './public/idea_static/js/'
            }
        },
        uglify: {
            options: {
                mangle: false
            },
            build: {
                files:{
                    'public/app.min.js': ['public/idea_static/js/app.js']
                }
            }
        },

        concat: {
            development: {
                files: {
                    'public/idea_static/js/core.js': [
                        'bower_components/angular/angular.js',
                        'bower_components/angular-route/angular-route.js',
                        'bower_components/angular-resource/angular-resource.js',
                        'bower_components/angular-cookies/angular-cookies.js'
                    ]
                }
            }
        },

        copy: {
            css: {
                expand: true,
                cwd: './styles/css/',
                src: '**',
                dest: './public/idea_static/css/'
            },
            js: {
                expand: true,
                cwd: './scripts/',
                src: '{,**/}*.js',
                dest: './public/idea_static/js/'
            },
            images: {
                expand: true,
                cwd: './images/',
                src: '*',
                dest: './public/idea_static/images/'
            },
            font: {
                expand: true,
                cwd: './styles/fonts/',
                src: '**',
                dest: './public/idea_static/fonts/'
            },

            build: {
                files: {
                    'dist/': [
                        './public/idea_static/{css/**, img/**}',
                        'views/**',
                        'server.js',
                        'node_modules/**'
                    ]
                }
            }
        },

        clean: {
            dist: {
                src: ['<%= config.dist %>', './.tmp'],
                force: true
            }
        }
    });

    grunt.registerTask('default', ['copy:css', 'ngmin:build', 'uglify:build', 'copy:font', 'copy:images', 'concat:development']);
    grunt.registerTask('build', ['clean:dist', 'copy:build', 'concat']);
};
