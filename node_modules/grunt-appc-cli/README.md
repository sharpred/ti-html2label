![Build Status](https://travis-ci.org/sharpred/grunt-appc-cli.svg?branch=master)
[![bitHound Score](https://www.bithound.io/github/sharpred/grunt-appc-cli/badges/score.svg)](https://www.bithound.io/github/sharpred/grunt-appc-cli)

# grunt-appc-cli

> Grunt plugin for Appcelerator Platform CLI tools

## Getting Started

This plugin requires Grunt.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-appc-cli --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-appc-cli');
```

## The "appc-cli" task

### Overview

In your project's Gruntfile, add a section named `appc-cli` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
    "appc-cli": {
        options: {
            // Task-specific options go here.
        },
        your_target: {
            // Target-specific file lists and/or options go here.
        }
    }
});
```

### Options

#### options.separator
Type: `String`
Default value: `',  '`

A string value that is used to do something with whatever.

#### options.punctuation
Type: `String`
Default value: `'.'`

A string value that is used to do something else with whatever else.

### Usage Examples

#### Ti Build
In this example, `appc ti build` option is used to run your app in the iOS simulator with liveview enabled.

```js
grunt.initConfig({
  "appc-cli": {
    'options': {},
        'simulator' : {
            "command" : "ti",
            "subcommand" : "build",
            "options" : {
                "log-level" : "info",
                "platform" : "ios",
                "project-dir" : ".",
                "target" : "simulator"
            },
            "args" : ['--no-banner', "--no-progress-bars", "--no-prompt" ,"--liveview"]
        },
    },
});
```

#### Run

In this example, `appc run` option is used to run your app in the iOS simulator for a specific device also with liveview enabled.

```js
grunt.initConfig({
    "appc-cli": {
        'options': {},
        'simulator': {
            "command": "run",
            "args": ["-p", "ios", "-C", "E1406EC4-2BE2-4DFB-BC7C-38473815E862", "--liveview"]
        }
    }
});
```

#### Clean

You could also have for example a `clean` target which would run `appc ti clean`:

```js
grunt.initConfig({
    "appc-cli": {
        "options": {},
        "clean": {
            "command": "ti",
            "subcommand": "clean"
        }
    }
});
```

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History

1.0.0 Initial release 30/10/15
