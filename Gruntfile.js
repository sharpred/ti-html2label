'use strict';

module.exports = function(grunt) {

    grunt.initConfig({

        pkg : grunt.file.readJSON('package.json'),

        clean : {
            unzip : ['modules'],
            modules : ['example/modules'],
            app : ['example/build']
        },

        titaniumifier : {
            module : {
                src : '.',
                dest : '.'
            }
        },

        titanium : {
            android : {
                options : {
                    command : 'build',
                    logLevel : 'debug',
                    projectDir : './example',
                    platform : 'android'
                }
            },
            ios : {
                options : {
                    command : 'build',
                    logLevel : 'debug',
                    projectDir : './example',
                    platform : 'ios'
                }
            },
            sdk : {
                options : {
                    command : 'sdk',
                    args : ['select', '<%= pkg.titaniumManifest.tisdk %>']
                }
            }
        },

        unzip : {
            module : {
                src : '<%= pkg.titaniumManifest.moduleid %>-commonjs-<%= pkg.version %>.zip',
                dest : 'example'
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-titaniumifier');
    grunt.loadNpmTasks('grunt-titanium');
    grunt.loadNpmTasks('grunt-zip');
    grunt.loadTasks('tasks');
    grunt.registerTask('build', ['titaniumifier:module']);

    grunt.registerTask('testios', ['unzip:module', 'titanium:sdk', 'titanium:ios', 'clean:unzip']);

    grunt.registerTask('testandroid', ['unzip:module', 'titanium:sdk', 'titanium:android', 'clean:unzip']);

    grunt.registerTask('ios', ['tiapp', 'clean', 'build', 'testios']);

    grunt.registerTask('android', ['tiapp', 'clean', 'build', 'testandroid']);

    grunt.registerTask('default', ['ios']);
};