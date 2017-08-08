'use strict';

module.exports = function (grunt) {

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        clean: {
            unzip: ['modules'],
            modules: ['example/modules'],
            app: ['example/build']
        },

        titaniumifier: {
            module: {
                src: '.',
                dest: '.'
            }
        },
        "appc-cli": {
            options: {},
            new: {
                command: 'new',
                args: ['-f', '--no-services', '-t', 'titanium', '--project-dir', './example', '-i', 'com.stepupapps.html2label.example', '-n', 'com.stepupapps.html2label.example']
            },
            whoami: {
                command: 'whoami'
            },
            simulator: {
                command: "run",
                args: ["-p", "ios", "-C", "60FEF0FE-32B5-44D2-B0AA-038E146AE764", '--project-dir', './example']
            },
            sdk: {
                command: "ti",
                subcommand: "sdk",
                args: ["select", '<%= pkg.titaniumManifest.tisdk %>']
            },
            ios: {
                command: "ti",
                subcommand: "build",
                options: {
                    "log-level": "info",
                    platform: "ios",
                    "project-dir": "./example",
                    target: "simulator"
                },
                args: ["--noisy"]
            },
            android: {
                command: "ti",
                subcommand: "build",
                options: {
                    "log-level": "info",
                    platform: "android",
                    "project-dir": "./example"
                },
                args: ["--noisy", "--build-only"]
            }
        },
        unzip: {
            module: {
                src: '<%= pkg.titaniumManifest.moduleid %>-commonjs-<%= pkg.version %>.zip',
                dest: 'example'
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-titaniumifier');
    grunt.loadNpmTasks('grunt-appc-cli');
    grunt.loadNpmTasks('grunt-zip');
    grunt.loadTasks('tasks');
    grunt.registerTask('build', ['titaniumifier:module']);

    grunt.registerTask('testios', ['unzip:module', 'appc-cli:sdk', 'appc-cli:ios', 'clean:unzip']);

    grunt.registerTask('testandroid', ['unzip:module', 'appc-cli:sdk', 'appc-cli:android', 'clean:unzip']);

    grunt.registerTask('ios', ['appc-cli:new', 'tiapp', 'clean', 'build', 'testios']);

    grunt.registerTask('android', ['appc-cli:new', 'tiapp', 'clean', 'build', 'testandroid']);

    grunt.registerTask('default', ['ios']);

    grunt.registerTask('appc', ['appc-cli:new']);
};