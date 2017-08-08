/*
 * grunt-appc-cli
 * https://github.com/paulryanwork/grunt-appc-cli
 *
 * Copyright (c) 2015 Paul Ryan
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    grunt.registerMultiTask('appc-cli', "appc CLI tasks", function () {
        var command = this.data.command,
            subcommand = this.data.subcommand,
            target = this.target;
        switch (command) {
            case "run":
                grunt.task.run("run:" + target);
                break;
            case "ti":
                grunt.task.run("ti:" + subcommand + ":" + target);
                break;
            case "new":
                grunt.task.run("newapp::" + target);
                break;
            case "whoami":
                grunt.task.run("whoami");
                break;
            default:
                grunt.log.ok(command + (subcommand ? " using " + subcommand : "") + " not implemented.  Fork git@github.com:sharpred/grunt-appc-cli.git and submit a pull request if not!");
        }
    });
};